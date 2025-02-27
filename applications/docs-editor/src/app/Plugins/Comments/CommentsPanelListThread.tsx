import { $getNodeByKey } from 'lexical'
import { useEffect, useMemo, useState } from 'react'
import clsx from '@proton/utils/clsx'
import { CommentsPanelListComment } from './CommentsPanelListComment'
import { CommentsComposer } from './CommentsComposer'
import type { CommentThreadInterface, LiveCommentsTypeStatusChangeData } from '@proton/docs-shared'
import { CommentThreadState, LiveCommentsEvent } from '@proton/docs-shared'
import { Icon, ToolbarButton } from '@proton/components'
import { useApplication } from '../../ApplicationProvider'
import { c, msgid } from 'ttag'
import { sendErrorMessage } from '../../Utils/errorMessage'
import { useCommentsContext } from './CommentsContext'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import type { CommentThreadMarkNode } from './CommentThreadMarkNode'
import { $isCommentThreadMarkNode } from './CommentThreadMarkNode'

export function CommentsPanelListThread({ thread }: { thread: CommentThreadInterface }) {
  const [editor] = useLexicalComposerContext()
  const { controller, markNodeMap, activeIDs } = useCommentsContext()

  const application = useApplication()
  const [isDeleting, setIsDeleting] = useState(false)

  const [typers, setTypers] = useState<string[]>([])

  useEffect(() => {
    controller.getTypersExcludingSelf(thread.id).then(setTypers).catch(sendErrorMessage)
    return application.eventBus.addEventCallback((data) => {
      const eventData = data as LiveCommentsTypeStatusChangeData
      const { threadId } = eventData
      if (threadId === thread.id) {
        controller.getTypersExcludingSelf(thread.id).then(setTypers).catch(sendErrorMessage)
      }
    }, LiveCommentsEvent.TypingStatusChange)
  }, [controller, application, thread.id])

  const markID = thread.markID

  const quote = useMemo(() => {
    let quote: string | undefined
    editor.getEditorState().read(() => {
      const markNodeKeys = markNodeMap.get(markID)
      if (markNodeKeys !== undefined) {
        const markNodeKey = Array.from(markNodeKeys)[0]
        const markNode = $getNodeByKey<CommentThreadMarkNode>(markNodeKey)
        if ($isCommentThreadMarkNode(markNode)) {
          quote = markNode.getTextContent()
        }
      }
    })
    return quote
  }, [editor, markID, markNodeMap])

  const handleClickThread = () => {
    controller.markThreadAsRead(thread.id).catch(sendErrorMessage)
  }

  const isActive = activeIDs.includes(markID)

  const isResolved = thread.state === CommentThreadState.Resolved

  const firstTyper = typers[0]
  const allTypersExceptLast = typers.slice(0, -1).join(', ')
  const lastTyper = typers[typers.length - 1]
  // translator: list of names (eg: "Tom, John and Henry")
  const usersTranslation = typers.length === 1 ? firstTyper : c('Info').t`${allTypersExceptLast} and ${lastTyper}`

  const canShowReplyBox = application.getRole().canComment() && !thread.isPlaceholder && !isDeleting && !isResolved

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events
    <li
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={0}
      data-thread-mark-id={markID}
      onClick={handleClickThread}
      className={clsx(
        'group/thread border-weak bg-norm mb-3.5 list-none overflow-hidden rounded border last:mb-0 focus:outline-none',
        isActive
          ? 'shadow-raised'
          : 'focus-within:[box-shadow:_var(--shadow-raised-offset)_rgb(var(--shadow-color,_var(--shadow-default-color))/var(--shadow-raised-opacity))]',
        thread.isPlaceholder || isDeleting ? 'pointer-events-none opacity-50' : '',
      )}
    >
      {quote && (
        <blockquote className="color-weak mx-3 mb-1 mt-2 line-clamp-1 border-l border-[--signal-warning] px-2.5 py-px text-xs font-medium leading-none before:content-none after:content-none">
          {quote}
        </blockquote>
      )}
      <ul className="my-3 px-3.5">
        {thread.comments.map((comment, index) => (
          <CommentsPanelListComment
            key={comment.id}
            comment={comment}
            thread={thread}
            isFirstComment={index === 0}
            setIsDeletingThread={setIsDeleting}
          />
        ))}
      </ul>
      {canShowReplyBox && (
        <div className="my-3 hidden px-3.5 group-focus-within/thread:block group-has-[.options-open]/thread:block">
          <CommentsComposer
            className="border-weak border ring-[--primary] focus-within:border-[--primary] focus-within:ring focus-within:ring-[--primary-minor-1]"
            placeholder={c('Placeholder').t`Reply...`}
            onSubmit={(content) => {
              controller.createComment(content, thread.id).catch(sendErrorMessage)
            }}
            onTextContentChange={(textContent) => {
              if (textContent.length > 0) {
                void controller.beganTypingInThread(thread.id)
              } else {
                void controller.stoppedTypingInThread(thread.id)
              }
            }}
            onBlur={() => {
              void controller.stoppedTypingInThread(thread.id)
            }}
            buttons={(canSubmit, submitComment) => {
              if (!canSubmit) {
                return null
              }
              return (
                <ToolbarButton
                  className="bg-primary rounded-full p-1"
                  title={c('Action').t`Reply`}
                  icon={<Icon name="arrow-up" size={3.5} />}
                  disabled={!canSubmit}
                  onClick={submitComment}
                />
              )
            }}
          />
        </div>
      )}
      {isResolved && (
        <div className="my-3 px-3.5">
          <button
            className="rounded border border-[--border-weak] px-2.5 py-1.5 text-sm hover:bg-[--background-weak] disabled:opacity-50"
            onClick={() => {
              controller.unresolveThread(thread.id).catch(sendErrorMessage)
            }}
          >
            {c('Action').t`Re-open thread`}
          </button>
        </div>
      )}
      {typers.length > 0 && (
        <div className="px-3.5 py-1.5 text-xs text-[--text-weak]">
          {c('Info').ngettext(
            msgid`${usersTranslation} is typing...`,
            `${usersTranslation} are typing...`,
            typers.length,
          )}
        </div>
      )}
    </li>
  )
}
