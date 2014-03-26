var register = require('./register');
var first = require('./first');
var promise = require('./promise');

module.exports = register('prepend', function (stringToPrepend, value) {
  return first(value).then(function (val) {
    return promise('' + stringToPrepend + val + '');
  });
});