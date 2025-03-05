import React from 'react';
import { X } from 'lucide-react';
import { cn } from '~/utils';

export interface ChipProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The content of the chip.
   */
  label: string;
  /**
   * Whether the chip is disabled.
   * @default false
   */
  disabled?: boolean;
  /**
   * Whether the chip is selected.
   * @default false
   */
  selected?: boolean;
  /**
   * Whether the chip should have a delete button.
   * @default false
   */
  onDelete?: () => void;
  /**
   * The icon to display at the start of the chip.
   */
  icon?: React.ReactNode;
  /**
   * The variant of the chip.
   * @default 'default'
   */
  variant?: 'default' | 'primary' | 'secondary' | 'outline';
  /**
   * The size of the chip.
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Chip component for displaying labels that are compact and actionable
 */
export const Chip = React.forwardRef<HTMLDivElement, ChipProps>(
  (
    {
      className,
      label,
      disabled = false,
      selected = false,
      onDelete,
      icon,
      variant = 'default',
      size = 'md',
      onClick,
      ...props
    },
    ref,
  ) => {
    // Determine if the chip is clickable
    const isClickable = !!onClick && !disabled;

    // Size classes based on size prop
    const sizeClasses = {
      sm: 'text-xs px-2 py-0.5 h-6',
      md: 'text-sm px-2.5 py-1 h-7',
      lg: 'text-base px-3 py-1.5 h-8',
    };

    // Variant classes with improved contrast and visibility
    const variantClasses = {
      default: 'bg-gray-200 text-gray-800 border border-gray-300 hover:bg-gray-300',
      primary: 'bg-primary-500 text-white border border-primary-600 hover:bg-primary-600',
      secondary: 'bg-secondary-100 text-secondary-800 border border-secondary-200 hover:bg-secondary-200',
      outline: 'bg-transparent border border-gray-300 text-gray-800 hover:bg-gray-100',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1 rounded-full transition-colors shadow-sm mb-2',
          sizeClasses[size],
          variantClasses[variant],
          selected && 'bg-primary-500 text-white border-primary-600',
          disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
          isClickable && 'cursor-pointer',
          className,
        )}
        onClick={isClickable ? onClick : undefined}
        role={isClickable ? 'button' : 'presentation'}
        aria-disabled={disabled}
        {...props}
      >
        {icon && <span className="shrink-0">{icon}</span>}
        <span className="truncate">{label}</span>
        {onDelete && (
          <button
            type="button"
            className="ml-1 rounded-full p-0.5 hover:bg-black/10 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            aria-label="Remove"
            disabled={disabled}
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    );
  },
);

Chip.displayName = 'Chip';