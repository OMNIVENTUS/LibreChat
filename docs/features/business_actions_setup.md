# Business Actions Setup

Business Actions enable LibreChat to display contextual action buttons above AI responses. These actions provide users with quick ways to interact with external systems based on the context of their conversation.

## Configuring Business Actions

Business Actions are powered by specialized providers that can be configured in LibreChat. Currently, the following providers are available:

1. **Search Actions Provider** - General search-related actions
2. **Movie Actions Provider** - Movie-related actions using The Movie Database API

### Movie Actions Provider Setup

The Movie Actions Provider requires an API key from The Movie Database (TMDB). Follow these steps to set up:

1. Create a TMDB account at [https://www.themoviedb.org/signup](https://www.themoviedb.org/signup)
2. Go to your account settings and navigate to the API section
3. Create a new API key by following their process (typically requires providing basic application information)
4. Once you have the API key, add it to your `.env` file:

```
# TMDB API key for movie-related business actions
TMDB_API_KEY=your_api_key_here
```

5. Restart your LibreChat instance for the changes to take effect

## Testing Business Actions

### Movie Actions

To test the Movie Actions provider, try asking the AI questions that contain movie-related terms, such as:

- "Recommend a movie about space"
- "What are some good action movies?"
- "Find films with Tom Hanks"
- "Suggest a movie to watch tonight"

You should see contextual actions appear above the AI's response with links to relevant movies on TMDB.

## Creating Custom Providers

You can create your own business actions providers by:

1. Creating a new file in `api/server/services/actions/` following the pattern of existing providers
2. Implementing the required `getActions` method
3. Registering your provider in `api/server/services/initBusinessActions.js`

See the `MovieActionsProvider.js` file for a comprehensive example of implementing a provider.

## Troubleshooting

If business actions are not appearing:

1. Check your server logs for any errors related to business actions providers
2. Verify that your API keys are correctly set in the `.env` file
3. Make sure your query contains terms that would trigger the relevant provider
4. Confirm that the provider is properly registered in `initBusinessActions.js`
