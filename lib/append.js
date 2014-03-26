var register = require('./register');
var first = require('./first');
var promise = require('./promise');

module.exports = register('append', function (stringToAppend, value) {
  return first(value).then(function (val) {
    return promise('' + val + stringToAppend + '');
  });
});