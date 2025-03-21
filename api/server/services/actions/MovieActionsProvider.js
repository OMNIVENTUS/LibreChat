const axios = require('axios');
const logger = require('~/config/winston');

/**
 * Provider to generate movie-related actions using the TMDB API
 * This provider watches for movie-related queries and provides appropriate actions
 */
class MovieActionsProvider {
  constructor() {
    // TMDB API details
    this.apiKey = process.env.TMDB_API_KEY || '';
    this.baseUrl = 'https://api.themoviedb.org/3';
    this.initialized = !!this.apiKey;

    if (!this.initialized) {
      logger.warn('[MovieActionsProvider] No TMDB API key found. Movie actions will not be available.');
    } else {
      logger.info('[MovieActionsProvider] Initialized with TMDB API');
    }
  }

  /**
   * Check if the query is movie-related
   * @param {string} query - The user's query
   * @returns {boolean} - True if the query is movie-related
   */
  isMovieQuery(query) {
    if (!query || typeof query !== 'string') {
      return false;
    }

    // Simple check for movie-related terms
    const movieTerms = ['movie', 'film', 'watch', 'cinema', 'theater'];
    const lowercaseQuery = query.toLowerCase();

    return movieTerms.some(term => lowercaseQuery.includes(term));
  }

  /**
   * Get actions based on the query
   * @param {string} query - The user's query
   * @param {string} userId - The user's ID
   * @param {object} options - Additional options
   * @returns {Promise<Array>} - Array of business actions
   */
  async getActions(query, userId, options = {}) {
    if (!this.initialized || !this.isMovieQuery(query)) {
      return [];
    }

    try {
      // Extract potential movie terms from the query
      const searchTerm = this.extractMovieSearchTerm(query);

      // If no valid search term, return empty actions
      if (!searchTerm) {
        return [];
      }

      // Get movie recommendations
      const movies = await this.fetchMovies(searchTerm);

      if (!movies.length) {
        // If no movies found, offer a general search action
        return [{
          type: 'link',
          label: `Search for "${searchTerm}" on TMDB`,
          url: `https://www.themoviedb.org/search?query=${encodeURIComponent(searchTerm)}`,
          icon: 'search',
          style: 'primary',
        }];
      }

      // Convert movies to business actions
      return this.moviesToActions(movies, searchTerm);
    } catch (error) {
      logger.error('[MovieActionsProvider] Error getting movie actions:', error);
      return [];
    }
  }

  /**
   * Extract the movie search term from the query
   * @param {string} query - The user's query
   * @returns {string} - The extracted search term
   */
  extractMovieSearchTerm(query) {
    const lowercaseQuery = query.toLowerCase();

    // Check for common patterns in queries
    const patterns = [
      /(?:movie|film|watch)s?\s+(?:about|like|titled|called|named)?\s+["']?([^"'?]+)["']?/i,
      /(?:recommend|suggest)\s+(?:a|some)?\s+(?:movie|film)s?\s+(?:about|like|with)?\s+([^?]+)/i,
      /what\s+(?:movie|film)s?\s+(?:has|have|contain|feature|include|star)s?\s+([^?]+)/i,
      /find\s+(?:movie|film)s?\s+(?:about|with|starring|featuring|by|from)\s+([^?]+)/i,
    ];

    for (const pattern of patterns) {
      const match = query.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    // Fallback: try to extract text after movie-related terms
    const movieTerms = ['movie', 'film', 'watch'];
    for (const term of movieTerms) {
      const termIndex = lowercaseQuery.indexOf(term);
      if (termIndex !== -1) {
        // Get everything after the term, removing common words
        const afterTerm = query.slice(termIndex + term.length).trim()
          .replace(/^(about|like|with|called|titled|named|a|the|for|of)\s+/i, '')
          .replace(/[?.,!]/g, '');

        if (afterTerm && afterTerm.length > 2) {
          return afterTerm;
        }
      }
    }

    // If all else fails, use query cleaning as a last resort
    const cleaned = query.replace(/(?:movie|film|watch|find|recommend|suggest)s?/gi, '')
      .replace(/[?.,!]/g, '')
      .trim();

    return cleaned.length > 3 ? cleaned : '';
  }

  /**
   * Fetch movies from TMDB API
   * @param {string} searchTerm - The search term
   * @returns {Promise<Array>} - Array of movie objects
   */
  async fetchMovies(searchTerm) {
    try {
      // First try to search for specific movies
      const searchResponse = await axios.get(`${this.baseUrl}/search/movie`, {
        params: {
          api_key: this.apiKey,
          query: searchTerm,
          include_adult: false,
          language: 'en-US',
          page: 1,
        },
      });

      if (searchResponse.data.results && searchResponse.data.results.length > 0) {
        // Return top 5 results from search
        return searchResponse.data.results.slice(0, 5);
      }

      // If no specific results, fall back to popular movies with genre filtering
      const genreResponse = await axios.get(`${this.baseUrl}/genre/movie/list`, {
        params: {
          api_key: this.apiKey,
          language: 'en-US',
        },
      });

      // Try to match genres with search terms
      const genres = genreResponse.data.genres || [];
      const matchedGenres = genres.filter(genre =>
        searchTerm.toLowerCase().includes(genre.name.toLowerCase()));

      let genreIds = matchedGenres.map(genre => genre.id);

      // If no genres matched, get popular movies
      const discoverResponse = await axios.get(`${this.baseUrl}/discover/movie`, {
        params: {
          api_key: this.apiKey,
          language: 'en-US',
          sort_by: 'popularity.desc',
          include_adult: false,
          include_video: false,
          page: 1,
          with_genres: genreIds.join(',') || undefined,
        },
      });

      return (discoverResponse.data.results || []).slice(0, 5);
    } catch (error) {
      logger.error('[MovieActionsProvider] Error fetching movies:', error);
      return [];
    }
  }

  /**
   * Convert movies to business actions
   * @param {Array} movies - Array of movie objects
   * @param {string} searchTerm - The original search term
   * @returns {Array} - Array of business actions
   */
  moviesToActions(movies, searchTerm) {
    const actions = [];

    // Add a search action at the top
    // actions.push({
    //   type: 'link',
    //   label: `Search for "${searchTerm}" on TMDB`,
    //   url: `https://www.themoviedb.org/search?query=${encodeURIComponent(searchTerm)}`,
    //   icon: 'search',
    //   style: 'primary',
    //   variant: 'pill', // Use pill variant for search action
    // });

    // Add actions for each movie
    movies.forEach(movie => {
      const year = movie.release_date ? new Date(movie.release_date).getFullYear() : '';
      const yearSuffix = year ? ` (${year})` : '';

      // Get poster path if available
      const thumbnailUrl = movie.poster_path
        ? `https://image.tmdb.org/t/p/w92${movie.poster_path}`
        : null;

      actions.push({
        type: 'link',
        label: `${movie.title}${yearSuffix}`,
        url: `https://www.themoviedb.org/movie/${movie.id}`,
        icon: 'film',
        style: 'secondary',
        variant: 'card', // Use card variant for movie actions
        thumbnailUrl, // Add thumbnail URL for movie poster
      });
    });

    // Add an action to see more results
    if (movies.length > 0) {
      actions.push({
        type: 'link',
        label: 'See more movie results',
        url: `https://www.themoviedb.org/search/movie?query=${encodeURIComponent(searchTerm)}`,
        icon: 'plus',
        style: 'neutral',
        variant: 'pill', // Use pill variant for "see more" action
      });
    }

    return actions;
  }
}

module.exports = MovieActionsProvider;