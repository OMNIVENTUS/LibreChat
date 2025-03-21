import { useState, useMemo, useCallback } from 'react';
import { usePromptGroupsInfiniteQuery, useGetStartupConfig } from '~/data-provider';
import type { TPromptGroup } from 'librechat-data-provider';
import { SystemCategories } from 'librechat-data-provider';

/**
 * Custom hook for managing shared prompts with pagination
 */
export default function useSharedPrompts(initialPageSize = 10) {
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [pageNumber, setPageNumber] = useState(1);
  const [isExpanded, setIsExpanded] = useState(false);
  const { data: startupConfig } = useGetStartupConfig();
  const { instanceProjectId } = startupConfig || {};

  // Query prompt groups with default category set to empty string to get all
  const promptsQuery = usePromptGroupsInfiniteQuery({
    name: '',//it's important tu put empty string and not null
    category: SystemCategories.SHARED_PROMPTS,
    pageSize,
    pageNumber: pageNumber.toString(),
  });

  // Extract all pages of data
  const allPages = promptsQuery.data?.pages || [];

  // Filter prompt groups to only show shared prompts (those in the instance project)
  const sharedPrompts = useMemo(() => {
    if (!allPages.length || !instanceProjectId) {
      return [];
    }

    // Flatten all pages and filter for shared prompts
    return allPages
      .flatMap(page => page.promptGroups)
      .filter(group => group.projectIds?.includes(instanceProjectId as string));
  }, [allPages, instanceProjectId]);

  // Next page function
  const nextPage = useCallback(() => {
    if (promptsQuery.hasNextPage) {
      setPageNumber(prev => prev + 1);
      promptsQuery.fetchNextPage();
    }
  }, [promptsQuery]);

  // Previous page function
  const prevPage = useCallback(() => {
    if (pageNumber > 1) {
      setPageNumber(prev => prev - 1);
    }
  }, [pageNumber]);

  // Toggle expanded state
  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev);

    // If expanding and we haven't loaded enough prompts, fetch more
    if (!isExpanded && sharedPrompts.length < 10 && promptsQuery.hasNextPage) {
      promptsQuery.fetchNextPage();
    }
  }, [isExpanded, sharedPrompts.length, promptsQuery]);

  return {
    sharedPrompts,
    isLoading: promptsQuery.isLoading,
    isFetching: promptsQuery.isFetching,
    hasNextPage: promptsQuery.hasNextPage,
    hasPreviousPage: pageNumber > 1,
    nextPage,
    prevPage,
    isExpanded,
    toggleExpanded,
  };
}