var register = require('./register');
var filter = require('./filter');
var inverseBoolean = require('./inverse_boolean');

module.exports = register('reject', function (handler, promises) {
  return filter(function (promise, idx) {
    return handler(promise, idx)
      .then(inverseBoolean);
  }, promises);
});