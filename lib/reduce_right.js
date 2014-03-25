var asArray = require('as-array');
var register = require('./register');
var reduce = require('./reduce');

module.exports = register('reduceRight', function (handler, promises) {
  return reduce(handler, asArray(promises).reverse());
});