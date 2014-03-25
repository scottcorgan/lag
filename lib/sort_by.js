var register = require('./register');
var map = require('./map');
var promise = require('./promise');

// Sort in ascending order
module.exports = register('sortBy', function (handler, promises) {
  return map(handler, promises).then(function (values) {
    return promise(values.sort(function (a, b) {
      return a - b;
    }));
  });
});