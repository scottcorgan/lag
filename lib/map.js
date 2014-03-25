var register = require('./register');
var each = require('./each');
var all = require('./all');

module.exports = register('map', function (handler, promises) {
  var mapped = [];
  
  return each(function (promise, idx) {
    return handler(promise, idx).then(mapped.push.bind(mapped));
  }, promises).then(function () {
    return all(mapped);
  });
});
