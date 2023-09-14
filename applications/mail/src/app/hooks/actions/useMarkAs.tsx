import { useCallback } from 'react';

import { c, msgid } from 'ttag';

import { FeatureCode, useApi, useEventManager, useFeature, useNotifications } from '@proton/components';
import { markConversationsAsRead, markConversationsAsUnread } from '@proton/shared/lib/api/conversations';
import { undoActions } from '@proton/shared/lib/api/mailUndoActions';
import { markMessageAsRead, markMessageAsUnread } from '@proton/shared/lib/api/messages';
import { MARK_AS_STATUS } from '@proton/shared/lib/mail/constants';

import { getFilteredUndoTokens, runParallelChunkedActions } from 'proton-mail/helpers/chunk';

import UndoActionNotification from '../../components/notifications/UndoActionNotification';
import { SUCCESS_NOTIFICATION_EXPIRATION } from '../../constants';
import { isMessage as testIsMessage } from '../../helpers/elements';
import { backendActionFinished, backendActionStarted } from '../../logic/elements/elementsActions';
import { isElementReminded } from '../../logic/snoozehelpers';
import { useAppDispatch } from '../../logic/store';
import { Element } from '../../models/element';
import { useOptimisticMarkAs } from '../optimistic/useOptimisticMarkAs';

const getNotificationTextMarked = (isMessage: boolean, elementsCount: number, status: MARK_AS_STATUS) => {
    if (isMessage) {
        if (elementsCount === 1) {
            return status === MARK_AS_STATUS.READ
                ? c('Success').t`Message marked as read.`
                : c('Success').t`Message marked as unread.`;
        }

        return status === MARK_AS_STATUS.READ
            ? c('Success').ngettext(
                  msgid`${elementsCount} message marked as read.`,
                  `${elementsCount} messages marked as read.`,
                  elementsCount
              )
            : c('Success').ngettext(
                  msgid`${elementsCount} message marked as unread.`,
                  `${elementsCount} messages marked as unread.`,
                  elementsCount
              );
    }

    if (elementsCount === 1) {
        return status === MARK_AS_STATUS.READ
            ? c('Success').t`Conversation marked as read.`
            : c('Success').t`Conversation marked as unread.`;
    }

    return status === MARK_AS_STATUS.READ
        ? c('Success').ngettext(
              msgid`${elementsCount} conversation marked as read.`,
              `${elementsCount} conversations marked as read.`,
              elementsCount
          )
        : c('Success').ngettext(
              msgid`${elementsCount} conversation marked as unread.`,
              `${elementsCount} conversations marked as unread.`,
              elementsCount
          );
};

export const useMarkAs = () => {
    const api = useApi();
    const { call, start, stop } = useEventManager();
    const optimisticMarkAs = useOptimisticMarkAs();
    const { createNotification } = useNotifications();
    const dispatch = useAppDispatch();
    const mailActionsChunkSize = useFeature(FeatureCode.MailActionsChunkSize).feature?.Value;

    const markAs = useCallback((elements: Element[], labelID = '', status: MARK_AS_STATUS, silent = true) => {
        if (!elements.length) {
            return;
        }

        const isMessage = testIsMessage(elements[0]);
        const markAsReadAction = isMessage ? markMessageAsRead : markConversationsAsRead;
        const markAsUnreadAction = isMessage ? markMessageAsUnread : markConversationsAsUnread;
        const action = status === MARK_AS_STATUS.READ ? markAsReadAction : markAsUnreadAction;
        const displaySnoozedReminder = status === MARK_AS_STATUS.READ ? false : isElementReminded(elements[0]);

        let rollback: (() => void) | undefined = () => {};

        const handleUndo = async (tokens: PromiseSettledResult<string | undefined>[]) => {
            try {
                // Stop the event manager to prevent race conditions
                stop();
                rollback?.();
                const filteredTokens = getFilteredUndoTokens(tokens);

                await Promise.all(filteredTokens.map((token) => api({ ...undoActions(token), silence: true })));
            } finally {
                start();
                await call();
            }
        };

        const request = async () => {
            let tokens = [];
            try {
                // Stop the event manager to prevent race conditions
                stop();
                dispatch(backendActionStarted());
                rollback = optimisticMarkAs(elements, labelID, {
                    status,
                    displaySnoozedReminder,
                });

                tokens = await runParallelChunkedActions({
                    api,
                    items: elements,
                    chunkSize: mailActionsChunkSize,
                    action: (chunk) =>
                        action(
                            chunk.map((element: Element) => element.ID),
                            labelID
                        ),
                });
            } catch (error: any) {
                createNotification({
                    text: c('Error').t`Something went wrong. Please try again.`,
                    type: 'error',
                });

                await handleUndo(error.data);
                throw error;
            } finally {
                dispatch(backendActionFinished());
                start();
                await call();
            }
            return tokens;
        };

        // No await since we are doing optimistic UI here
        const promise = request();

        if (!silent) {
            const notificationText = getNotificationTextMarked(isMessage, elements.length, status);

            createNotification({
                text: (
                    <UndoActionNotification onUndo={async () => handleUndo(await promise)}>
                        {notificationText}
                    </UndoActionNotification>
                ),
                expiration: SUCCESS_NOTIFICATION_EXPIRATION,
            });
        }
    }, []);

    return markAs;
};
