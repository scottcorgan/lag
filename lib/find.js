var register = require('./register');
var each = require('./each');
var promise = require('./promise');

var find = register('find', buildFind(each));
find.series = register('findSeries', buildFind(each.series));

function buildFind (_each) {
  return function (handler, promises) {
    var wanted;
    
    return _each(function (value, idx) {
      return handler(value, idx).then(function (passed) {
        
        // FIXME: this leaves some promises hanging
        // when no values match
        
        if (passed && !wanted) wanted = value;
      });
    }, promises).then(function () {
      return promise(wanted);
    });
  }
}

module.exports = find;