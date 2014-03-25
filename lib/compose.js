var asArray = require('as-array');
var promise = require('./promise');

module.exports = function () {
  var fns = asArray(arguments).reverse();
  
  return function (promises) {
    return promise(function (resolve, reject) {
      executeFunction(promises)

      function executeFunction (promises) {
        var fn = fns.shift();
        
        return fn
          ? fn(promises).then(executeFunction, reject)
          : resolve(promise(promises));
      };
    });
  };
};