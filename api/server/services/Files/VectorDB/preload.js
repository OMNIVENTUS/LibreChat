const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const mime = require('mime');
const { uploadVectors } = require('./crud');
const { createFile, File } = require('~/models/File');
const { findUser, createUser } = require('~/models/userMethods');
const { logger } = require('~/config');

/**
 * Get or create the admin user for preloading files
 * @returns {Promise<{id: string, email: string}>}
 */
const getAdminUser = async () => {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@librechat.ai';

  try {
    // Try to find existing admin user
    const adminUser = await findUser({ email: adminEmail, role: 'ADMIN' }, '_id email');

    if (adminUser) {
      logger.debug('Found existing admin user for preload');
      return {
        id: adminUser._id.toString(),
        email: adminUser.email,
      };
    }

    // If no admin found and we're in development, create one
    if (process.env.NODE_ENV === 'development') {
      logger.info('Creating admin user for preload (development only)');
      const newAdmin = await createUser({
        email: adminEmail,
        name: 'System Admin',
        username: 'admin',
        role: 'ADMIN',
        provider: 'local',
        file_access_groups: ['admin', 'preload_access'],
      }, true, true);

      return {
        id: newAdmin._id.toString(),
        email: newAdmin.email,
      };
    }

    throw new Error('No admin user found and not in development mode');
  } catch (error) {
    logger.error('Error getting admin user:', error);
    throw error;
  }
};

const createInitialToken = (adminUser) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment');
  }

  const payload = {
    id: adminUser.id,
    email: adminUser.email,
    role: 'admin',
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '1h',
  });
};

const createInitialRequest = (adminUser) => ({
  headers: {
    authorization: `Bearer ${createInitialToken(adminUser)}`,
  },
  user: {
    id: adminUser.id,
    email: adminUser.email,
    role: 'admin',
  },
});

/**
 * Check if a file already exists with the same properties
 * @param {string} filename - Name of the file
 * @param {string[]} access_control - Access control groups
 * @param {string} scope - File scope
 * @returns {Promise<boolean>}
 */
const isFileDuplicate = async (filename, access_control, scope) => {
  try {
    const existingFile = await File.findOne({
      filename,
      access_control: { $all: access_control },
      scope,
    }).lean();
    return !!existingFile;
  } catch (error) {
    logger.error('Error checking for duplicate file:', error);
    return false;
  }
};

/**
 * Determine access control and scope based on folder path
 * @param {string} folderPath - Path to the folder containing the file
 * @returns {{ access_control: string[], scope: string }}
 */
const getAccessControlFromPath = (folderPath) => {
  const folderName = path.basename(folderPath);

  // Default configuration
  const defaultConfig = {
    access_control: ['admin', 'preload_access'],
    scope: 'shared',
  };

  // Root path configuration
  if (folderPath === process.env.RAG_PRELOAD_PATH) {
    return {
      access_control: ['admin', 'preload_access'],
      scope: 'public',
    };
  }

  // Public folder configuration
  if (folderName.toLowerCase() === 'public') {
    return {
      access_control: ['admin', 'preload_access'],
      scope: 'public',
    };
  }

  // Specific group folder configuration
  return {
    access_control: ['admin', folderName.toLowerCase()],
    scope: 'shared',
  };
};

/**
 * Check if file should be processed based on its extension
 * @param {string} filename - Name of the file
 * @returns {boolean}
 */
const isProcessableFile = (filename) => {
  // Skip hidden files and system files
  if (filename.startsWith('.')) {
    return false;
  }

  // List of supported file extensions
  //add image types
  //   const supportedExtensions = [
  //     '.txt', '.pdf', '.doc', '.docx',
  //     '.csv', '.md', '.rtf', '.json',
  //     '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff', '.ico', '.webp',
  //     // Add more supported extensions as needed
  //   ];

  //   const ext = path.extname(filename).toLowerCase();
  //   return supportedExtensions.includes(ext);
  return true;
};

/**
 * Process a single file for preloading
 * @param {Object} params - Parameters for file processing
 */
const processSinglePreloadFile = async ({ filepath, filename, req, folderPath }) => {
  const stats = fs.statSync(filepath);
  const { access_control, scope } = getAccessControlFromPath(folderPath);

  // Check for duplicates
  const isDuplicate = await isFileDuplicate(filename, access_control, scope);
  if (isDuplicate) {
    logger.info(`Skipping duplicate file: ${filename}`);
    return null;
  }

  // Get proper MIME type
  const mimeType = mime.getType(filename) || 'application/octet-stream';

  const file = {
    path: filepath,
    size: stats.size,
    originalname: filename,
    mimetype: mimeType,
  };

  const file_id = uuidv4();

  try {
    const uploadResult = await uploadVectors({
      req,
      file,
      file_id,
      entity_id: 'preload',
    });

    const fileInfo = {
      user: req.user.id,
      file_id,
      bytes: file.size,
      filepath: uploadResult.filepath,
      filename: file.originalname,
      context: 'preload',
      type: file.mimetype,
      embedded: uploadResult.embedded,
      source: 'vectordb',
      scope,
      access_control,
    };

    await createFile(fileInfo, true);
    logger.info(`Successfully preloaded file: ${filename} with access groups: [${access_control.join(', ')}] and scope: ${scope}`);
    return fileInfo;
  } catch (error) {
    logger.error(`Failed to preload file ${filename}:`, error);
    throw error;
  }
};

/**
 * Process files in a directory recursively
 * @param {string} dirPath - Path to process
 * @param {Object} req - Request object
 */
const processDirectory = async (dirPath, req) => {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    const results = {
      success: 0,
      skipped: 0,
      failed: 0,
      errors: [],
    };

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      try {
        if (entry.isDirectory()) {
          const subDirResults = await processDirectory(fullPath, req);
          // Aggregate results from subdirectory
          results.success += subDirResults.success;
          results.skipped += subDirResults.skipped;
          results.failed += subDirResults.failed;
          results.errors.push(...subDirResults.errors);
        } else if (entry.isFile()) {
          if (!isProcessableFile(entry.name)) {
            logger.info(`Skipping unsupported file: ${entry.name}`);
            results.skipped++;
            continue;
          }

          const fileResult = await processSinglePreloadFile({
            filepath: fullPath,
            filename: entry.name,
            req,
            folderPath: dirPath,
          });

          if (fileResult) {
            results.success++;
          } else {
            // null result means file was skipped (e.g., duplicate)
            results.skipped++;
          }
        }
      } catch (error) {
        results.failed++;
        results.errors.push({
          file: entry.name,
          error: error.message,
        });
        logger.error(`Error processing ${entry.name}: ${error.message}`);
        // Continue with next file instead of throwing
        continue;
      }
    }

    return results;
  } catch (error) {
    logger.error(`Error reading directory ${dirPath}:`, error);
    throw error;
  }
};

async function preloadFiles() {
  if (!process.env.RAG_PRELOAD_PATH) {
    logger.info('No RAG preload path specified, skipping preload');
    return;
  }

  const preloadPath = path.resolve(process.env.RAG_PRELOAD_PATH);

  if (!fs.existsSync(preloadPath)) {
    logger.warn(`RAG preload path ${preloadPath} does not exist`);
    return;
  }

  try {
    const adminUser = await getAdminUser();
    const req = createInitialRequest(adminUser);

    const results = await processDirectory(preloadPath, req);

    // Log final results
    logger.info('Preload completed with results:', {
      successful: results.success,
      skipped: results.skipped,
      failed: results.failed,
    });

    if (results.failed > 0) {
      logger.warn('Failed files:', results.errors);
    }
  } catch (error) {
    logger.error('Error during RAG preload:', error);
  }
}

module.exports = {
  preloadFiles,
};