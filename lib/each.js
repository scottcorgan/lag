var asArray = require('as-array');
var register = require('./register');
var promise = require('./promise');
var all = require('./all');

var each = register('each', function (handler, promises) {
  return all(asArray(promises).map(function (value, idx) {
    return handler(promise(value), idx);
  }));
});

each.series = register('eachSeries', function (handler, promises) {
  var currentPromise = promise(true);
  var p = asArray(promises).map(function (value, idx) {
    return currentPromise = currentPromise.then(function () {
      return handler(promise(value), idx);
    });
  });
    
  return all(p);
});

module.exports = each;