const crud = require('./crud');
const { preloadFiles } = require('./preload');

module.exports = {
  ...crud,
  preloadFiles,
};
