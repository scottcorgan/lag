var asArray = require('as-array');
var promise = require('./promise');
var first = require('./first');
var all = require('./all');

var reverse = function (promises) {
  return all(promises.reverse());
};

reverse.values = function (value) {
  return first(value).then(function (arr) {
    return promise(arr.reverse());
  });
};

module.exports = reverse;