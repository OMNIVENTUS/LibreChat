const { logger } = require('~/config');
const BusinessActionsService = require('./BusinessActionsService');

// Import providers
const SearchActionProvider = require('./actions/SearchActionsProvider');
const MovieActionsProvider = require('./actions/MovieActionsProvider');

/**
 * Initialize the BusinessActionsService by registering all available providers
 */
function initBusinessActions() {
  try {
    // Register the search actions provider
    BusinessActionsService.registerProvider(SearchActionProvider);
    logger.info('[BusinessActions] Registered SearchActionProvider');

    // Register the movie actions provider
    BusinessActionsService.registerProvider(new MovieActionsProvider());
    logger.info('[BusinessActions] Registered MovieActionsProvider');

    // Additional providers can be registered here

    logger.info('[BusinessActions] All providers registered successfully');
  } catch (error) {
    logger.error('[BusinessActions] Error initializing business actions:', error);
  }
}

module.exports = initBusinessActions;