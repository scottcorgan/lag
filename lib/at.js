var register = require('./register');
var promise = require('./promise');
var filter = require('./filter');

module.exports = register('at', function (indexes, promises) {
  return filter.series(function (value, idx) {
    return promise(indexes.indexOf(idx) > -1);
  }, promises);
});