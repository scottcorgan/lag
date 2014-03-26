var register = require('./register');
var asArray = require('as-array');
var each = require('./each');
var promise = require('./promise');

module.exports = register('reduce', function (handler, promises) {
  promises = asArray(promises);
  
  var accum = promises.shift();
  
  return each.series(function (value, idx) {
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