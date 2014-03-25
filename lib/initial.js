var asArray = require('as-array');
var all = require('./all');
var promise = require('./promise');
var first = require('./first');

var initial = function (promises) {
  return all(promises.slice(0, promises.length-1));
};

initial.values = function (value) {
  return first(value).then(function (arr) {
    arr = asArray(arr);
    return promise(arr.slice(0, arr.length-1));
  });
};

module.exports = initial;