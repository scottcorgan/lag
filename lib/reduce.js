var register = require('./register');
var asArray = require('as-array');
var eachSeries = require('./each_series');
var promise = require('./promise');

module.exports = register('reduce', function (handler, promises) {
  promises = asArray(promises);
  
  var accum = promises.shift();
  
  return eachSeries(function (value, idx) {
    return promise(function (resolve, reject) {
      handler(accum, value, idx).then(function (val) {
        accum = promise(val);
        resolve();
      });
    });
  }, promises).then(function () {
    return promise(accum);
  });
});