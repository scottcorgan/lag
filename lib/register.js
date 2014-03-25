var asArray = require('as-array');
var partial = require('./partial');

// Main method to create new, partialized methods
module.exports = function (name, fn, options) {
  options = options || {};
  
  return function (handler, value) {
    var args = asArray(arguments);
    
    // All arguments
    if (args.length > 1 && !options.partial) return fn.apply(null, args);    
    
    // Partial handler
    args.unshift(fn);
    return partial.apply(null, args);
  };
};