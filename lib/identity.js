var promise = require('./promise');

module.exports = function () {
  return promise(arguments[0]);
};