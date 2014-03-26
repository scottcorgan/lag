var extend = require('extend');
var asArray = require('as-array');
var register = require('./register');
var identity = require('./identity');
var map = require('./map');
var promise = require('./promise');

module.exports = register('extend', function () {
  return map(identity, asArray(arguments))
    .then(function (objects) {
      return promise(extend.apply(null, objects));
    });
}, {
  parital: false
});