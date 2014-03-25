var register = require('./register');
var filterSeries = require('./filter_series');
var inverseBoolean = require('./inverse_boolean');

module.exports = register('rejectSeries', function (handler, promises) {
  return filterSeries(function (promise, idx) {
    return handler(promise, idx)
      .then(inverseBoolean);
  }, promises);
});