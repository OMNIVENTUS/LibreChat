const checkAdmin = require('./admin');
const checkStrictAdmin = require('./checkStrictAdmin');
const { checkAccess, generateCheckAccess } = require('./generateCheckAccess');

module.exports = {
  checkAdmin,
  checkStrictAdmin,
  checkAccess,
  generateCheckAccess,
};
