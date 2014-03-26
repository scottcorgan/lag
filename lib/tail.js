var asArray = require('as-array');
var first = require('./first');
var all = require('./all');
var promise = require('./promise');

var tail = function (promises) {
  return all(promises.slice(1));
};

tail.values = function (value) {
  return first(value).then(function (arr) {
    arr = asArray(arr);
    return promise(arr.slice(1));
  });
};

module.exports = tail;