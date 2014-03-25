var register = require('./register');
var eachSeries = require('./each_series');
var all = require('./all');

module.exports = register('mapSeries', function (handler, promises) {
  var mapped = [];
  
  return eachSeries(function (promise, idx) {
    return handler(promise, idx).then(mapped.push.bind(mapped));
  }, promises).then(function () {
    return all(mapped);
  });
});
