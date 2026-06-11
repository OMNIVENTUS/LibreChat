// [OMNIVENTUS] Phase 2: getUsersController and deleteUserController were retired
// in favor of upstream's native Admin Users API (/api/admin/users). Only the
// user-update endpoint remains — upstream has no equivalent (used by the
// user-admin UI for role and file_access_groups changes).
const { User } = require('~/db/models');
const { logger } = require('~/config');
const { SystemRoles } = require('librechat-data-provider');

const isAdmin = (req) => {
  return req.user.role === SystemRoles.ADMIN;
};
const isManager = (req) => {
  return req.user.role === SystemRoles.MANAGER;
};

/**
 * Update a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateUserController = async (req, res) => {
  try {
    if (!isAdmin(req) && !isManager(req)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    const { userId } = req.params;
    const updateData = req.body;

    // Prevent updating sensitive fields
    delete updateData.password;
    delete updateData.refreshToken;
    delete updateData.totpSecret;
    delete updateData.backupCodes;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, select: '-password -refreshToken -totpSecret -backupCodes' },
    ).lean();

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(user);
  } catch (error) {
    logger.error('[updateUserController] Error updating user:', error);
    res.status(500).json({ message: 'Error updating user' });
  }
};

module.exports = {
  updateUserController,
};
