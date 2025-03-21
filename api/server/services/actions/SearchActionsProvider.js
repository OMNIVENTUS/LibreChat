// api/server/services/actions/SearchActionProvider.js
class SearchActionProvider {
  async getActions(query, userId, options) {
    // Analyze query to determine relevant actions
    if (query.toLowerCase().includes('search for') || query.toLowerCase().includes('find')) {
      return [
        {
          type: 'button',
          label: 'Search in Knowledge Base',
          url: '/knowledge-base',
          icon: 'search',
          style: 'primary',
        },
        {
          type: 'button',
          label: 'View Related Documents',
          url: '/documents',
          icon: 'document',
          style: 'secondary',
        },
      ];
    }
    return [];
  }
}

module.exports = new SearchActionProvider();