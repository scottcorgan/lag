var asArray = require('as-array');
var register = require('./register');
var promise = require('./promise');
var all = require('./all');

module.exports = register('eachSeries', function (handler, promises) {
  var currentPromise = promise(true);
  var p = asArray(promises).map(function (value, idx) {
    return currentPromise = currentPromise.then(function () {
      return handler(promise(value), idx);
    });
  });
    
  return all(p);
});