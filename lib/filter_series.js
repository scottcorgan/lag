var register = require('./register');
var eachSeries = require('./each_series');
var all = require('./all');

module.exports = register('filterSeries', function (handler, promises) {
  var filtered = [];
  
  return eachSeries(function (promise, idx) {
    return handler(promise, idx).then(function (passed) {
      if (passed) filtered.push(promise);
    });
  }, promises).then(function () {
    return all(filtered);
  });
});