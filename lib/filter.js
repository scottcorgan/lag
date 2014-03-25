var register = require('./register');
var each = require('./each');
var all = require('./all');

module.exports = register('filter', function (handler, promises) {
  var filtered = [];
  
  return each(function (promise, idx) {
    return handler(promise, idx).then(function (passed) {
      if (passed) filtered.push(promise);
    });
  }, promises).then(function () {
    return all(filtered);
  });
});