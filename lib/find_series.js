var register = require('./register');
var eachSeries = require('./each_series');
var promise = require('./promise');

module.exports = register('findSeries', function (handler, promises) {
  var wanted;
  
  return eachSeries(function (value, idx) {
    return handler(value, idx).then(function (passed) {
      
      // FIXME: this leaves some promises hanging
      // when no values match
      
      if (passed && !wanted) wanted = value;
    });
  }, promises).then(function () {
    return promise(wanted);
  });
});