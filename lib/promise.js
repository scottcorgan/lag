var Promise = require('promise');

module.exports = function (value) {
  if (typeof value === 'function') return new Promise(value);
  return Promise.from(value);
};