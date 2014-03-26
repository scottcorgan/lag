var asArray = require('as-array');
var partial = require('./partial');
var all = require('./all');
var promise = require('./promise');

// Main method to create new, partialized methods
var register = function (name, fn, options) {
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

register.operateOnValues = function(operation) {
  return register('op', function (value1, value2) {
    return all(value1, value2).then(function (values) {
      return promise(operation(values[0], values[1]));
    });
  });
};

module.exports = register;