import { useQueryClient } from '@tanstack/react-query';
import { QueryKeys } from 'librechat-data-provider';
import type { EventSubmission, TMessage } from 'librechat-data-provider';

/**
 * Hook to handle business actions events from SSE
 * This follows the same pattern as other event handlers in the codebase
 */
export default function useBusinessActionsHandler() {
  const queryClient = useQueryClient();

  return ({ data, submission }: { data: any; submission: EventSubmission }) => {
    try {
      if (!data.messageId) {
        return;
      }

      const { messageId, actions } = data;
      // Access the conversationId directly from submission
      const conversationId = submission.conversation?.conversationId;

      // First, update the React Query cache
      if (conversationId) {
        // Get the current messages from the cache
        queryClient.setQueryData(
          [QueryKeys.messages, conversationId],
          (oldData: TMessage[] | undefined) => {
            if (!oldData) {
              //console.log('[BusinessActions] No existing messages found in cache');
              return oldData;
            }

            // console.log('[BusinessActions] Updating message in cache. Total messages:', oldData.length);

            // Find and update the specific message with the business actions
            const updatedData = oldData.map((message) => {
              if (message.messageId === messageId) {

                // Add contextualActions to the message
                return {
                  ...message,
                  contextualActions: Array.isArray(actions) ? actions : [],
                };
              }
              return message;
            });

            return updatedData;
          },
        );

        // console.log('[BusinessActions] Updated message cache and triggered re-render for:', messageId);
      } else {
        // If we don't have a conversation ID, fall back to invalidating the query
        // console.log('[BusinessActions] No conversation ID available, invalidating all message queries');
        //queryClient.invalidateQueries([QueryKeys.messages]);
      }
    } catch (error) {
      console.error('[BusinessActions] Error processing business actions:', error);
    }
  };
}