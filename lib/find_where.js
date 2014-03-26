var register = require('./register');
var promise = require('./promise');
var find = require('./find');

module.exports = register('where', function (matchers, promises) {
  var keys = Object.keys(matchers);
  
  return find.series(function (value) {
    return value.then(function (obj) {
      var matching = false;
      
      keys.forEach(function (key) {
        if (obj[key] === matchers[key]) matching = true;
      });
      
      return promise(matching);
    });
  }, promises);
});