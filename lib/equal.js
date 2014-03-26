var register = require('./register');

module.exports = register.operateOnValues(function (a, b) {
  return a === b;
});