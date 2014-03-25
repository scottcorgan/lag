var Promise = require('promise');
var asArray = require('as-array');

module.exports = function () {
  return Promise.all.apply(null, asArray(arguments));
};