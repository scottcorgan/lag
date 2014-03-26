var asArray = require('as-array');
var promise = require('./promise');

var first = function (promises) {
  return promise(asArray(promises)[0]);
};

first.value = function (value) {
  return first(value).then(function (arr) {
    return promise(asArray(arr)[0]);
  });
};

module.exports = first;