var register = require('./register');
var each = require('./each');
var promise = require('./promise');

module.exports = register('find', function (handler, promises) {
  var wanted;
  
  return each(function (value, idx) {
    return handler(value, idx).then(function (passed) {
      
      // FIXME: this leaves some promises hanging
      // when no values match
      
      if (passed && !wanted) wanted = value;
    });
  }, promises).then(function () {
    return promise(wanted);
  });
});