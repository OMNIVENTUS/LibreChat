const { logger } = require('@librechat/data-schemas');
const { EToolResources, FileContext } = require('librechat-data-provider');
const { File } = require('~/db/models');

/**
 * Finds a file by its file_id with additional query options.
 * @param {string} file_id - The unique identifier of the file.
 * @param {object} options - Query options for filtering, projection, etc.
 * @returns {Promise<MongoFile>} A promise that resolves to the file document or null.
 */
const findFileById = async (file_id, options = {}) => {
  return await File.findOne({ file_id, ...options }).lean();
};

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
  if (optionsOrSortOptions && typeof optionsOrSortOptions === 'object' && !Array.isArray(optionsOrSortOptions)) {
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

/**
 * Retrieves tool files (files that are embedded or have a fileIdentifier) from an array of file IDs
 * @param {string[]} fileIds - Array of file_id strings to search for
 * @param {Set<EToolResources>} toolResourceSet - Optional filter for tool resources
 * @returns {Promise<Array<MongoFile>>} Files that match the criteria
 */
const getToolFilesByIds = async (fileIds, toolResourceSet) => {
  if (!fileIds || !fileIds.length || !toolResourceSet?.size) {
    return [];
  }

  try {
    const filter = {
      file_id: { $in: fileIds },
      $or: [],
    };

    if (toolResourceSet.has(EToolResources.context)) {
      filter.$or.push({ text: { $exists: true, $ne: null }, context: FileContext.agents });
    }
    if (toolResourceSet.has(EToolResources.file_search)) {
      filter.$or.push({ embedded: true });
    }
    if (toolResourceSet.has(EToolResources.execute_code)) {
      filter.$or.push({ 'metadata.fileIdentifier': { $exists: true } });
    }

    const selectFields = { text: 0 };
    const sortOptions = { updatedAt: -1 };

    return await getFiles(filter, sortOptions, selectFields);
  } catch (error) {
    logger.error('[getToolFilesByIds] Error retrieving tool files:', error);
    throw new Error('Error retrieving tool files');
  }
};

/**
 * Creates a new file with a TTL of 1 hour.
 * @param {MongoFile} data - The file data to be created, must contain file_id.
 * @param {boolean} disableTTL - Whether to disable the TTL.
 * @returns {Promise<MongoFile>} A promise that resolves to the created file document.
 */
const createFile = async (data, disableTTL) => {
  const fileData = {
    ...data,
    expiresAt: new Date(Date.now() + 3600 * 1000),
  };

  if (disableTTL) {
    delete fileData.expiresAt;
  }

  return await File.findOneAndUpdate({ file_id: data.file_id }, fileData, {
    new: true,
    upsert: true,
  }).lean();
};

/**
 * Updates a file identified by file_id with new data and removes the TTL.
 * @param {MongoFile} data - The data to update, must contain file_id.
 * @returns {Promise<MongoFile>} A promise that resolves to the updated file document.
 */
const updateFile = async (data) => {
  const { file_id, ...update } = data;
  const updateOperation = {
    $set: update,
    $unset: { expiresAt: '' }, // Remove the expiresAt field to prevent TTL
  };
  return await File.findOneAndUpdate({ file_id }, updateOperation, { new: true }).lean();
};

/**
 * Increments the usage of a file identified by file_id.
 * @param {MongoFile} data - The data to update, must contain file_id and the increment value for usage.
 * @returns {Promise<MongoFile>} A promise that resolves to the updated file document.
 */
const updateFileUsage = async (data) => {
  const { file_id, inc = 1 } = data;
  const updateOperation = {
    $inc: { usage: inc },
    $unset: { expiresAt: '', temp_file_id: '' },
  };
  return await File.findOneAndUpdate({ file_id }, updateOperation, { new: true }).lean();
};

/**
 * Deletes a file identified by file_id.
 * @param {string} file_id - The unique identifier of the file to delete.
 * @returns {Promise<MongoFile>} A promise that resolves to the deleted file document or null.
 */
const deleteFile = async (file_id) => {
  return await File.findOneAndDelete({ file_id }).lean();
};

/**
 * Deletes a file identified by a filter.
 * @param {object} filter - The filter criteria to apply.
 * @returns {Promise<MongoFile>} A promise that resolves to the deleted file document or null.
 */
const deleteFileByFilter = async (filter) => {
  return await File.findOneAndDelete(filter).lean();
};

/**
 * Deletes multiple files identified by an array of file_ids.
 * @param {Array<string>} file_ids - The unique identifiers of the files to delete.
 * @returns {Promise<Object>} A promise that resolves to the result of the deletion operation.
 */
const deleteFiles = async (file_ids, user) => {
  let deleteQuery = { file_id: { $in: file_ids } };
  if (user) {
    deleteQuery = { user: user };
  }
  return await File.deleteMany(deleteQuery);
};

/**
 * Batch updates files with new signed URLs in MongoDB
 *
 * @param {MongoFile[]} updates - Array of updates in the format { file_id, filepath }
 * @returns {Promise<void>}
 */
async function batchUpdateFiles(updates) {
  if (!updates || updates.length === 0) {
    return;
  }

  const bulkOperations = updates.map((update) => ({
    updateOne: {
      filter: { file_id: update.file_id },
      update: { $set: { filepath: update.filepath } },
    },
  }));

  const result = await File.bulkWrite(bulkOperations);
  logger.info(`Updated ${result.modifiedCount} files with new S3 URLs`);
}

module.exports = {
  findFileById,
  getFiles,
  getToolFilesByIds,
  createFile,
  updateFile,
  updateFileUsage,
  deleteFile,
  deleteFiles,
  deleteFileByFilter,
  batchUpdateFiles,
};
