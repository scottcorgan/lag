var register = require('./register');
var promise = require('./promise');
var filterSeries = require('./filter_series');

module.exports = register('at', function (indexes, promises) {
  return filterSeries(function (value, idx) {
    return promise(indexes.indexOf(idx) > -1);
  }, promises);
});