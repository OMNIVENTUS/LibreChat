import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '~/utils/';
import type { TPromptGroup } from 'librechat-data-provider';
import { PermissionTypes, Permissions } from 'librechat-data-provider';
import { Chip } from '~/components/ui';
import { useHasAccess, useLocalize, useSubmitMessage } from '~/hooks';
import useSharedPrompts from '~/hooks/Prompts/useSharedPrompts';
import VariableDialog from '~/components/Prompts/Groups/VariableDialog';
import { detectVariables } from '~/utils';

/**
 * List of shared prompts rendered as chips for quick access
 */
interface SharedPromptListProps {
  /**
   * Callback when a prompt is selected
   */
  onSelectPrompt: (promptText: string) => void;
  /**
   * Optional CSS class name for the container
   */
  className?: string;
  /**
   * Initial number of prompts to show
   * @default 5
   */
  initialVisible?: number;
}

/**
 * SharedPromptList component displays a list of shared prompts as chips
 * for easy access and selection
 */
const SharedPromptList: React.FC<SharedPromptListProps> = ({
  onSelectPrompt,
  className,
  initialVisible = 5,
}) => {
  const localize = useLocalize();
  const [hoveredPromptId, setHoveredPromptId] = useState<string | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<TPromptGroup | null>(null);
  const [isVariableDialogOpen, setVariableDialogOpen] = useState(false);
  const { submitPrompt } = useSubmitMessage();

  // Check if user has access to prompts
  const hasAccess = useHasAccess({
    permissionType: PermissionTypes.PROMPTS,
    permission: Permissions.USE,
  });

  // Use our custom hook for shared prompts with pagination
  const {
    sharedPrompts,
    isLoading,
    isExpanded,
    toggleExpanded,
    nextPage,
    hasNextPage,
  } = useSharedPrompts(initialVisible * 2);

  // Determine how many prompts to show based on expanded state
  const visiblePrompts = useMemo(() => {
    if (isExpanded) {
      return sharedPrompts;
    }
    return sharedPrompts.slice(0, initialVisible);
  }, [sharedPrompts, isExpanded, initialVisible]);

  // Handle prompt click - use the prompt handler from parent
  const handlePromptClick = (prompt: TPromptGroup) => {
    // Check if the prompt has a production prompt
    if (prompt.productionPrompt?.prompt) {
      const text = prompt.productionPrompt.prompt;

      // Check for variables in the prompt
      if (detectVariables(text)) {
        // Show variable dialog if prompt has variables
        setSelectedPrompt(prompt);
        setVariableDialogOpen(true);
        return;
      }

      // No variables, use prompt directly
      onSelectPrompt(text);
      submitPrompt(text);
    }
  };

  // If user doesn't have access or there's an error, don't render
  if (!hasAccess) {
    return null;
  }

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('mt-2 flex flex-wrap gap-2 px-2', className)}>
        <div className="h-8 w-20 animate-pulse rounded-full bg-secondary/60"></div>
        <div className="h-8 w-32 animate-pulse rounded-full bg-secondary/60"></div>
        <div className="h-8 w-24 animate-pulse rounded-full bg-secondary/60"></div>
      </div>
    );
  }

  // Empty state - don't render anything
  if (sharedPrompts.length === 0) {
    return null;
  }

  // Using a more stable approach with UI text
  return (
    <div className={cn('mt-2 flex flex-col gap-2 px-2', className)}>
      <div className="flex flex-wrap gap-2 relative">
        {visiblePrompts.map((prompt) => (
          <Chip
            key={prompt._id || `prompt-${prompt.name}`}
            label={prompt.name}
            variant="primary"
            size="sm"
            className={cn(
              'cursor-pointer shadow-sm',
              hoveredPromptId === prompt._id ? 'bg-primary-700 border-primary-800' : '',
            )}
            onMouseEnter={() => setHoveredPromptId(prompt._id || null)}
            onMouseLeave={() => setHoveredPromptId(null)}
            onClick={() => handlePromptClick(prompt)}
          />
        ))}

        {/* Integrated Show More/Less button as a special chip */}
        {sharedPrompts.length > initialVisible && (
          <div
            className={cn(
              'inline-flex items-center gap-1 rounded-full transition-colors shadow-sm mb-2 cursor-pointer px-3 py-1',
              'bg-gradient-to-r from-blue-100 to-indigo-100 border border-blue-200 text-blue-700 hover:from-blue-200 hover:to-indigo-200',
              'text-xs font-medium'
            )}
            onClick={toggleExpanded}
            role="button"
            tabIndex={0}
            aria-label={isExpanded ? 'Show fewer prompts' : 'Show more prompts'}
          >
            {isExpanded ? (
              <span className="flex items-center gap-1">
                <ChevronUp className="h-3 w-3" aria-hidden="true" />
                <span>{localize('com_ui_shared_prompts_less')}</span>
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <ChevronDown className="h-3 w-3" aria-hidden="true" />
                <span>{localize('com_ui_shared_prompts_more')}</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Load more button (if expanded and has more pages) - now styled consistently */}
      {isExpanded && hasNextPage && (
        <div className="flex justify-end mt-1">
          <div
            className={cn(
              'inline-flex items-center gap-1 rounded-full transition-colors shadow-sm cursor-pointer px-3 py-1',
              'bg-gradient-to-r from-gray-100 to-blue-50 border border-gray-200 text-gray-700 hover:from-gray-200 hover:to-blue-100',
              'text-xs font-medium'
            )}
            onClick={nextPage}
            role="button"
            tabIndex={0}
            aria-label="Load more prompts"
          >
            <span className="flex items-center gap-1">
              <ChevronDown className="h-3 w-3" aria-hidden="true" />
              <span>{localize('com_ui_shared_prompts_more')}</span>
            </span>
          </div>
        </div>
      )}

      {/* Variable Dialog */}
      <VariableDialog
        open={isVariableDialogOpen}
        onClose={() => setVariableDialogOpen(false)}
        group={selectedPrompt}
      />
    </div>
  );
};

export default SharedPromptList;