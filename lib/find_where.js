var register = require('./register');
var promise = require('./promise');
var findSeries = require('./find_series');

module.exports = register('where', function (matchers, promises) {
  var keys = Object.keys(matchers);
  
  return findSeries(function (value) {
    return value.then(function (obj) {
      var matching = false;
      
      keys.forEach(function (key) {
        if (obj[key] === matchers[key]) matching = true;
      });
      
      return promise(matching);
    });
  }, promises);
});