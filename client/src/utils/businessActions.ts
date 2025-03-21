/**
 * Business Actions Utilities
 *
 * This file provides utilities for working with business actions in the application.
 * It serves as a centralized export point for business actions-related functionality.
 */

// We can add any additional business action utility functions here in the future
// For now, this file mainly serves as a placeholder for future utility functions

/**
 * Validates a business action object
 *
 * @param action The business action to validate
 * @returns A boolean indicating whether the action is valid
 */
export function isValidBusinessAction(action: any): boolean {
  return (
    action &&
    typeof action === 'object' &&
    typeof action.id === 'string' &&
    typeof action.label === 'string' &&
    typeof action.type === 'string'
  );
}

/**
 * Filter out any invalid business actions from an array
 *
 * @param actions Array of potential business actions
 * @returns Array containing only valid business actions
 */
export function filterValidBusinessActions(actions: any[]): any[] {
  return Array.isArray(actions) ? actions.filter(isValidBusinessAction) : [];
}

// Export additional utilities as needed