var promise = require('./promise');
var first = require('./first');

module.exports = function (value) {
  return promise(first(value).then(Object.keys));
};