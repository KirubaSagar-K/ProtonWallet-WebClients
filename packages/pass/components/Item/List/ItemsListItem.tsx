import { type FC, memo } from 'react';
import { useSelector } from 'react-redux';
import { Link, type LinkProps } from 'react-router-dom';

import { ButtonLike, type ButtonLikeProps } from '@proton/atoms/Button';
import { Icon, Marks } from '@proton/components/components';
import { useBulkSelect } from '@proton/pass/components/Bulk/BulkSelectProvider';
import { IconBox } from '@proton/pass/components/Layout/Icon/IconBox';
import { ItemIcon, OptimisticItemIcon } from '@proton/pass/components/Layout/Icon/ItemIcon';
import { itemTypeToSubThemeClassName } from '@proton/pass/components/Layout/Theme/types';
import { VaultIcon } from '@proton/pass/components/Vault/VaultIcon';
import { useFeatureFlag } from '@proton/pass/hooks/useFeatureFlag';
import { matchChunks } from '@proton/pass/lib/search/match-chunks';
import { selectShare } from '@proton/pass/store/selectors';
import type { ItemRevisionWithOptimistic, ShareType } from '@proton/pass/types';
import { PassFeature } from '@proton/pass/types/api/features';
import { isEmptyString } from '@proton/pass/utils/string/is-empty-string';
import clsx from '@proton/utils/clsx';

import { presentListItem } from './utils';

import './ItemsListItem.scss';

type Props = Partial<LinkProps> &
    ButtonLikeProps<any> & {
        item: ItemRevisionWithOptimistic;
        search?: string;
        active?: boolean;
    };

const ItemsListItemRaw: FC<Props> = ({ item, search = '', active = false, ...rest }) => {
    const { data, optimistic, failed, shareId } = item;
    const { heading, subheading } = presentListItem(item);
    const vault = useSelector(selectShare<ShareType.Vault>(shareId));
    const pinningEnabled = useFeatureFlag(PassFeature.PassPinningV1);
    const bulk = useBulkSelect();

    return (
        <ButtonLike
            as={Link}
            to="#"
            className={clsx([
                'pass-item-list--item interactive-pseudo w-full relative',
                optimistic && !failed && 'opacity-50',
                active && 'is-active',
            ])}
            color={failed ? 'warning' : 'weak'}
            shape="ghost"
            {...rest}
        >
            <div className="flex-nowrap flex w-full px-3 py-2 items-center">
                <OptimisticItemIcon
                    item={item}
                    size={5}
                    className={clsx('mr-3  shrink-0', itemTypeToSubThemeClassName[data.type])}
                />
                {bulk.isBulk && (
                    <ItemIcon
                        icon="checkmark"
                        alt=""
                        size={20}
                        className={clsx(
                            'pass-item-icon mr-3 shrink-0 absolute bulk-select-check',
                            bulk.isSelected(item) && 'selected'
                        )}
                        pill
                        loadImage={false}
                        normColor={false}
                    />
                )}
                {pinningEnabled && item.pinned && (
                    <IconBox
                        size={2.5}
                        mode="transparent"
                        className={clsx(
                            'pass-item-list--item--pin absolute top-custom left-custom flex items-center justify-center',
                            itemTypeToSubThemeClassName[data.type]
                        )}
                        style={{ '--top-custom': '32px', '--left-custom': '36px' }}
                    >
                        <Icon name="pin-angled-filled" size={2.75} className="absolute-center" color="black" />
                    </IconBox>
                )}

                <div className="text-left">
                    <span className="flex items-center">
                        {search && (
                            <VaultIcon size={3} icon={vault?.content.display.icon} className="color-weak mr-1" />
                        )}
                        <span className="flex-1 text-ellipsis">
                            <Marks chunks={matchChunks(heading, search)}>{heading}</Marks>
                        </span>
                    </span>
                    <div
                        className={clsx([
                            'pass-item-list--subtitle block color-weak text-sm text-ellipsis',
                            item.data.type === 'note' && isEmptyString(item.data.metadata.note.v) && 'text-italic',
                        ])}
                    >
                        <Marks chunks={matchChunks(subheading, search)}>{subheading}</Marks>
                    </div>
                </div>
            </div>
        </ButtonLike>
    );
};

export const ItemsListItem = memo(ItemsListItemRaw);
