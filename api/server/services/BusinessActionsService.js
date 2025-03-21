// api/server/services/BusinessActionsService.js
const { logger } = require('~/config');

class BusinessActionsService {
  constructor() {
    this.actionProviders = [];
  }

  registerProvider(provider) {
    this.actionProviders.push(provider);
  }

  /**
   * Generate contextual business actions based on user query
   * @param {string} query - The user's query text
   * @param {string} userId - The user ID
   * @param {Object} options - Additional context
   * @returns {Promise<Array>} - Array of action objects
   */
  async generateActions(query, userId, options = {}) {
    try {
      let allActions = [];

      // Process all providers in parallel
      const actionPromises = this.actionProviders.map(provider =>
        provider.getActions(query, userId, options),
      );

      const results = await Promise.allSettled(actionPromises);

      results.forEach(result => {
        if (result.status === 'fulfilled' && Array.isArray(result.value)) {
          allActions = [...allActions, ...result.value];
        }
      });

      return allActions;
    } catch (error) {
      logger.error('[BusinessActionsService] Error generating actions:', error);
      return [];
    }
  }
}

module.exports = new BusinessActionsService();