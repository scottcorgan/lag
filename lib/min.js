var all = require('./all');
var promise = require('./promise');

module.exports = function (promises) {
  return all(promises).then(function (values) {
    return promise(Math.min.apply(Math, values));
  });
};