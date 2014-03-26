var register = require('./register');
var promise = require('./promise');
var filter = require('./filter');

module.exports = register('where', function (matchers, promises) {
  var keys = Object.keys(matchers);
  
  return filter(function (value) {
    return value.then(function (obj) {
      var matching = false;
      
      keys.forEach(function (key) {
        if (obj[key] === matchers[key]) matching = true;
      });
      
      return promise(matching);
    });
  }, promises);
});