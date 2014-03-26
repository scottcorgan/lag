var register = require('./register');
var all = require('./all');
var promise = require('./promise');

module.exports = register('pluck', function (key, promises) {
  return all(promises).then(function (res) {
    return promise(res.map(function (obj) {
      return obj[key];
    }));
  });
});