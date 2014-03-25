var asArray = require('as-array');
var register = require('./register');
var promise = require('./promise');
var all = require('./all');

module.exports = register('each', function (handler, promises) {
  return all(asArray(promises).map(function (value, idx) {
    return handler(promise(value), idx);
  }));
});