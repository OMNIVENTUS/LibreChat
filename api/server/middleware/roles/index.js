const { checkAccess, generateCheckAccess } = require('@librechat/api');
const checkAdmin = require('./admin');
// [OMNIVENTUS] strict admin check (user administration feature);
// checkAccess/generateCheckAccess re-exported from @librechat/api (moved upstream in v0.8.x)
const checkStrictAdmin = require('./checkStrictAdmin');

module.exports = {
  checkAdmin,
  checkStrictAdmin,
  checkAccess,
  generateCheckAccess,
};
