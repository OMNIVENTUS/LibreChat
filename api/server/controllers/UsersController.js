const User = require('~/models/User');
const { logger } = require('~/config');
const { SystemRoles } = require('librechat-data-provider');

const isAdmin = (req) => {
  return req.user.role === SystemRoles.ADMIN;
};
const isManager = (req) => {
  return req.user.role === SystemRoles.MANAGER;
};

/**
 * Get all users
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getUsersController = async (req, res) => {
  try {
    if (!isAdmin(req) && !isManager(req)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    const users = await User.find({}, '-password -refreshToken -totpSecret -backupCodes').lean();
    res.status(200).json(users);
  } catch (error) {
    logger.error('[getUsersController] Error getting users:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
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

/**
 * Delete a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteUserController = async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    const { userId } = req.params;

    // Prevent deleting the last admin user
    const isLastAdmin = await User.countDocuments({ role: 'ADMIN' }) === 1;
    const userToDelete = await User.findById(userId);

    if (isLastAdmin && userToDelete?.role === 'ADMIN') {
      return res.status(400).json({ message: 'Cannot delete the last admin user' });
    }

    const result = await User.findByIdAndDelete(userId);
    if (!result) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    logger.error('[deleteUserController] Error deleting user:', error);
    res.status(500).json({ message: 'Error deleting user' });
  }
};

module.exports = {
  getUsersController,
  updateUserController,
  deleteUserController,
};