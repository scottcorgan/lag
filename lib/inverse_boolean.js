var promise = require('./promise');
var bln = require('./boolean');

module.exports = function (value) {
  return promise(value)
    .then(bln)
    .then(function (val) {
      return promise(!val);
    });
};