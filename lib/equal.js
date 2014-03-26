var register = require('./register');
var all = require('./all');
var promise = require('./promise');

module.exports = register('equal', operateOnValues(function (a, b) {
  return a === b;
}));

function operateOnValues(operation) {
  return function (value1, value2) {
    return all(value1, value2).then(function (values) {
      return promise(operation(values[0], values[1]));
    });
  };
}