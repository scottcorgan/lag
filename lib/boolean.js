var promise = require('./promise');

module.exports = function (value) {
  return promise(value)
    .then(function (val) {
      return promise(!!val);
    });
};