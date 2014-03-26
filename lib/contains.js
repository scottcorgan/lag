var register = require('./register');
var find = require('./find');
var equal = require('./equal');
var bln = require('./boolean');

module.exports = register('contains', function (value, promises) {
  return find(equal(value), promises).then(bln);
});