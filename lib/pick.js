var register = require('./register');
var all = require('./all');
var promise = require('./promise');

module.exports = register('pick', function (keys, value) {
  var returnObj = {};
  
  return all(value, all(keys)).then(function (results) {
    var obj = results[0];
    var resolvedKeys = results[1];
    
    resolvedKeys.forEach(function (key) {
      returnObj[key] = obj[key];
    });
    
    return promise(returnObj);
  });
});