const express = require('express');
const { requireJwtAuth, checkAdmin } = require('~/server/middleware');
const {
  getUsersController,
  updateUserController,
  deleteUserController,
} = require('~/server/controllers/UsersController');

const router = express.Router();

// Get all users (admin only)
router.get('/', requireJwtAuth, checkAdmin, getUsersController);

// Update user (admin only)
router.put('/:userId', requireJwtAuth, checkAdmin, updateUserController);

// Delete user (admin only)
router.delete('/:userId', requireJwtAuth, checkAdmin, deleteUserController);

module.exports = router;