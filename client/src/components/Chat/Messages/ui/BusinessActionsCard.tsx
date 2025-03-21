import React, { useState, useRef, useEffect } from 'react';
import { cn } from '~/utils';
import { useLocalize } from '~/hooks';
import { ChevronLeft, ChevronRight, ExternalLink, Zap } from 'lucide-react';

// Define the shape of a single business action
export interface BusinessAction {
  type: 'link' | 'button' | 'action';
  label: string;
  url?: string;
  actionId?: string;
  icon?: string;
  thumbnailUrl?: string; // Optional thumbnail image URL
  style?: 'primary' | 'secondary' | 'danger' | 'neutral';
  variant?: 'card' | 'pill'; // New variant option
}

interface BusinessActionsCardProps {
  actions: BusinessAction[];
  messageId: string;
  className?: string;
  isLoading?: boolean; // New loading prop
}

/**
 * BusinessActionsCard component that displays contextual business actions
 * as a card above the AI response
 */
const BusinessActionsCard: React.FC<BusinessActionsCardProps> = ({
  actions,
  messageId,
  className,
  isLoading = false,
}) => {
  const localize = useLocalize();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(false);

  // Update scroll indicators when actions change or on resize
  const checkScrollButtons = () => {
    if (!scrollContainerRef.current) {return;}

    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setShowLeftScroll(scrollLeft > 20);
    setShowRightScroll(scrollLeft < scrollWidth - clientWidth - 20);
  };

  useEffect(() => {
    if (!scrollContainerRef.current) {return;}

    const container = scrollContainerRef.current;

    // Initial check
    checkScrollButtons();

    // Add scroll listener
    container.addEventListener('scroll', checkScrollButtons);

    // Add resize listener
    window.addEventListener('resize', checkScrollButtons);

    return () => {
      container.removeEventListener('scroll', checkScrollButtons);
      window.addEventListener('resize', checkScrollButtons);
    };
  }, [actions]);

  const handleScroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) {return;}

    const scrollAmount = container.clientWidth * 0.8;
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  const handleActionClick = (action: BusinessAction) => {
    if (action.type === 'link' && action.url) {
      window.open(action.url, '_blank');
    } else if (action.type === 'action' && action.actionId) {
      // Handle custom actions here
      console.log('Action clicked:', action.actionId);
    }
  };

  if (!isLoading && (!actions || actions.length === 0)) {
    return null;
  }

  // Define a static title since we don't have the specific translation key yet
  const SUGGESTED_ACTIONS = 'Suggested actions:';

  return (
    <div
      id={`business-actions-${messageId}`}
      className={cn(
        'relative mb-3 w-full p-4 ',
        className,
      )}
    >
      {/* <h3 className="mb-3 text-sm font-medium text-token-text-primary">
        {SUGGESTED_ACTIONS}
      </h3> */}

      {/* Scroll buttons */}
      {showLeftScroll && (
        <button
          onClick={() => handleScroll('left')}
          className="absolute left-1 top-1/2 z-10 -translate-y-1/2 rounded-full bg-surface-primary p-1 shadow-md hover:bg-surface-secondary"
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}

      {showRightScroll && (
        <button
          onClick={() => handleScroll('right')}
          className="absolute right-1 top-1/2 z-10 -translate-y-1/2 rounded-full bg-surface-primary p-1 shadow-md hover:bg-surface-secondary"
          aria-label="Scroll right"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}

      {/* Scrollable container for actions */}
      <div
        ref={scrollContainerRef}
        className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-rounded-full scrollbar-thumb-gray-300 scrollbar-track-transparent items-center"
      >
        {isLoading ? (
          // Skeleton loading state
          <>
            {[1, 2, 3].map((i) => (
              <div key={`skeleton-${i}`} className={cn(
                'h-[70px] w-[140px] animate-pulse rounded-lg bg-surface-secondary',
                'flex-shrink-0 mr-4',
                'w-[160px]'
              )}>
                <div className="flex animate-pulse space-x-4">
                  <div className="size-10 rounded-full bg-gray-200"></div>

                  <div className="flex-1 space-y-6 py-1">
                    <div className="h-2 rounded bg-gray-200"></div>
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2 h-2 rounded bg-gray-200"></div>
                        <div className="col-span-1 h-2 rounded bg-gray-200"></div>
                      </div>
                      <div className="h-2 rounded bg-gray-200"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </>
        ) : (
          // Actual action cards/pills
          actions.map((action, index) => {
            // Determine if we should use card or pill variant
            const isCard = action.variant !== 'pill';

            return isCard ? (
              // Card variant
              <button
                key={`${action.label}-${index}`}
                onClick={() => handleActionClick(action)}
                className={cn(
                  'group flex h-[70px] min-w-[140px] max-w-[180px] flex-shrink-0 flex-col items-start justify-between rounded-lg p-3 text-left transition-all',
                  //'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                  'hover:shadow-md hover:bg-accent-primary/20',
                  'border border-border-light bg-surface-primary',
                //   action.style === 'primary' &&
                //     'bg-accent-primary/10 text-accent-primary hover:bg-accent-primary/20',
                //   action.style === 'secondary' &&
                //     'bg-accent-secondary/10 text-token-text-primary hover:bg-accent-secondary/20',
                //   action.style === 'danger' &&
                //     'bg-danger/10 text-danger hover:bg-danger/20',
                //   action.style === 'neutral' &&
                //     'bg-surface-secondary text-token-text-primary hover:bg-surface-secondary/80',
                //   !action.style && 'bg-accent-primary/10 text-accent-primary hover:bg-accent-primary/20',
                )}
              >
                <div className="flex w-full items-start justify-between">
                  {action.thumbnailUrl ? (
                    <img
                      src={action.thumbnailUrl}
                      alt=""
                      className="h-6 w-6 rounded-md object-cover"
                    />
                  ) : action.icon ? (
                    <span className="flex h-6 w-6 items-center justify-center">
                      <i className={`bi bi-${action.icon}`} />
                    </span>
                  ) : (
                    <Zap className="h-5 w-5" />
                  )}

                  {action.type === 'link' && <ExternalLink className="h-4 w-4 opacity-50 group-hover:opacity-100" />}
                </div>

                <span className="line-clamp-2 w-full text-sm font-medium">
                  {action.label}
                </span>
              </button>
            ) : (
              // Pill variant
              <button
                key={`${action.label}-${index}`}
                onClick={() => handleActionClick(action)}
                className={cn(
                  'inline-flex h-9 flex-shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap',
                  'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 justify-center',
                  action.style === 'primary' &&
                    'bg-accent-primary text-accent-fg hover:bg-accent-primary/90',
                  action.style === 'secondary' &&
                    'bg-accent-secondary text-token-text-primary hover:bg-accent-secondary/90',
                  action.style === 'danger' &&
                    'bg-danger text-white hover:bg-danger/90',
                  action.style === 'neutral' &&
                    'bg-surface-secondary text-token-text-primary hover:bg-surface-secondary/90',
                  !action.style && 'bg-accent-primary text-accent-fg hover:bg-accent-primary/90',
                )}
              >
                {action.icon && (
                  <span className="flex h-4 w-4 items-center justify-center">
                    <i className={`bi bi-${action.icon}`} />
                  </span>
                )}
                {action.label}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default BusinessActionsCard;