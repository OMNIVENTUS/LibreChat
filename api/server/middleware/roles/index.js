const checkAdmin = require('./checkAdmin');
const checkStrictAdmin = require('./checkStrictAdmin');
const { checkAccess, generateCheckAccess } = require('./generateCheckAccess');

module.exports = {
  checkAdmin,
  checkStrictAdmin,
  checkAccess,
  generateCheckAccess,
};
