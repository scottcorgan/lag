var register = require('./register');
var filter = require('./filter');
var inverseBoolean = require('./inverse_boolean');

var reject = register('reject', buildReject(filter));
reject.series = register('rejectSeries', buildReject(filter.series));

function buildReject (_filter) {
  return function (handler, promises) {
    return _filter(function (promise, idx) {
      return handler(promise, idx)
        .then(inverseBoolean);
    }, promises);
  };
}

module.exports = reject;