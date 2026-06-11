// [OMNIVENTUS] user-update endpoint kept because upstream's native Admin Users
// API (/api/admin/users) has no user-update route. Listing and deletion were
// retired in Phase 2 in favor of the upstream admin API.
const express = require('express');
const { requireJwtAuth, checkAdmin } = require('~/server/middleware');
const { updateUserController } = require('~/server/controllers/UsersController');

const router = express.Router();

// Update user (admin or manager; checkAdmin allows both)
router.put('/:userId', requireJwtAuth, checkAdmin, updateUserController);

module.exports = router;
