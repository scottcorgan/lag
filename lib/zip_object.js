var zipObject = require('zip-object');
var register = require('./register');
var promise = require('./promise');
var all = require('./all');

module.exports = register('zipObject', function (arr1, arr2) {
  return all(arr1, arr2)
    .then(function (values) {
      return promise(zipObject.apply(null, values));
    });
}, {
  partial: false
});