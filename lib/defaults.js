var asArray = require('as-array');
var register = require('./register');
var identity = require('./identity');
var map = require('./map');
var promise = require('./promise');

module.exports = register('defaults', function () {
  return map(identity, asArray(arguments).reverse())
    .then(function (objects) {
      return promise(defaults.apply(null, objects));
    });
}, {
  partial: false
});

function defaults (options, defaults) {
  options = options || {};

  Object.keys(defaults).forEach(function(key) {
    if (typeof options[key] === 'undefined') {
      options[key] = defaults[key];
    }
  });

  return options;
};