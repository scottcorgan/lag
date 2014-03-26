var register = require('./register');
var all = require('./all');
var pick = require('./pick');
var contains = require('./contains');
var reject = require('./reject');

module.exports = register('omit', function (keys, promise) {
  return all(promise, all(keys)).then(function (results) {
    var obj = results[0];
    var keysToRemove = results[1];
      
    var keys = reject(function (key) {
      return contains(key, keysToRemove);
    }, Object.keys(obj));
    
    return pick(keys, obj);
  });
});
