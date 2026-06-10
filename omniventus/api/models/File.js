/**
 * Retrieves files matching a given filter, including scope-based access
 * @param {Object} filter - The filter criteria to apply
 * @param {Object|Object} [optionsOrSortOptions] - Options object with user context OR sort options (for backward compatibility)
 * @param {Object|String} [selectFields={ text: 0 }] - Fields to include/exclude in the query results. Default excludes the 'text' field.
 * @returns {Promise<Array<MongoFile>>} Array of accessible files
 */
const getFiles = async (filter, optionsOrSortOptions = {}, selectFields = { text: 0 }) => {
  // Handle both old format (options object with user) and new format (sortOptions, selectFields)
  let options = {};
  let sortOptions = { updatedAt: -1 };
  let finalSelectFields = selectFields;

  // Check if optionsOrSortOptions is an options object (has user property) or sort options
  if (
    optionsOrSortOptions &&
    typeof optionsOrSortOptions === 'object' &&
    !Array.isArray(optionsOrSortOptions)
  ) {
    if (optionsOrSortOptions.user !== undefined || optionsOrSortOptions.sort !== undefined) {
      // Old format: options object
      options = optionsOrSortOptions;
      sortOptions = { updatedAt: -1, ...options.sort };
      finalSelectFields = selectFields;
    } else {
      // New format: sortOptions
      sortOptions = { updatedAt: -1, ...optionsOrSortOptions };
      finalSelectFields = selectFields;
    }
  }

  const { user } = options;

  // Apply scope-based access control if user is provided
  if (user?.id) {
    const accessGroups = [
      ...(user?.file_access_groups || []),
      user?.role, // Include the user's role for backward compatibility
      user?.id, // Include user ID for direct shares
    ].filter(Boolean);

    const OrFilter = [
      { scope: 'public' }, // Public files
      {
        scope: 'shared',
        access_control: {
          $in: accessGroups,
        },
      },
    ];

    OrFilter.push({ user: user.id });

    // Allow admins and managers to access all shared files
    if (user?.role === 'ADMIN' || user?.role === 'MANAGER') {
      OrFilter.push({ scope: 'shared' });
    }

    const scopeFilter = {
      $or: OrFilter,
    };

    filter = { ...scopeFilter, ...filter };
  }

  const query = File.find(filter).select(finalSelectFields).sort(sortOptions);
  return await query.lean();
};

module.exports = {
  getFiles,
};
