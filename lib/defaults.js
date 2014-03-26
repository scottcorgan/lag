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

function defaults (options, _defaults) {
  options = options || {};

  Object.keys(_defaults).forEach(function(key) {
    if (typeof options[key] === 'undefined') {
      options[key] = _defaults[key];
    }
  });

  return options;
}