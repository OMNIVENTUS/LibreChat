const { SystemRoles } = require('librechat-data-provider');

/**
 * Middleware to check if a user has the strict ADMIN role (not MANAGER)
 * For operations that should only be accessible by the highest admin role
 */
function checkStrictAdmin(req, res, next) {
  try {
    if (req.user.role !== SystemRoles.ADMIN) {
      return res.status(403).json({ message: 'Forbidden - Admin only operation' });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
}

module.exports = checkStrictAdmin;