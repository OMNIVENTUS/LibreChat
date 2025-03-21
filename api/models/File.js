const mongoose = require('mongoose');
const fileSchema = require('./schema/fileSchema');
const logger = require('../utils/logger');
const File = mongoose.model('File', fileSchema);

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
 * @param {Object} options - Additional options including user context
 * @returns {Promise<Array<MongoFile>>} Array of accessible files
 */
const getFiles = async (filter, options = {}) => {
  const { user } = options;
  //handle access groups only if user is defined
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

  if (user?.id) {
    OrFilter.push({ user: user.id });
  }

  // Allow admins and managers to access all shared files
  if (user?.role === 'ADMIN' || user?.role === 'MANAGER') {
    OrFilter.push({ scope: 'shared' });
  }

  const scopeFilter = {
    $or: OrFilter,
  };

  const finalFilter = user?.id ? { ...scopeFilter, ...filter } : filter;

  const sortOptions = { updatedAt: -1, ...options.sort };
  return await File.find(finalFilter).sort(sortOptions).lean();
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

module.exports = {
  File,
  findFileById,
  getFiles,
  createFile,
  updateFile,
  updateFileUsage,
  deleteFile,
  deleteFiles,
  deleteFileByFilter,
};
