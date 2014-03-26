var promise = require('./promise');

module.exports = function (value) {
  return value.then(function (val) {
    console.log(val);
    return promise(val);
  });
};