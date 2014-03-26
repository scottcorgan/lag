var find = require('./find');
var bln = require('./boolean');

module.exports = function (promises) {
  return find(bln, promises).then(bln);
};