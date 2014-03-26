var promise = require('./promise');
var first = require('./first');

module.exports = function (value) {
  return first(value)
    .then(function (obj) {
      var values = Object.keys(obj).map(function (key) {
        return obj[key];
      });
    
      return promise(values);
    });
};