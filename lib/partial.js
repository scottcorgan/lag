var asArray = require('as-array');

module.exports = function () {
  var partialArgs = asArray(arguments);
  var fn = partialArgs.shift();
  
  return function () {
    var appliedArgs = asArray(arguments);
    return fn.apply(null, partialArgs.concat(appliedArgs));
  };
};