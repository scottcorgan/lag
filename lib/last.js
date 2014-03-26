var asArray = require('as-array');
var promise = require('./promise');
var first = require('./first');

var last = function (promises) {
  return promise(promises[promises.length - 1]);
};

last.value = function (value) {
  return first(value).then(function (arr) {
    arr = asArray(arr);
    return promise(arr[arr.length - 1]);
  });
};

module.exports = last;