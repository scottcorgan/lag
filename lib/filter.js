var register = require('./register');
var each = require('./each');
var all = require('./all');

var filter = register('filter', buildFilter(each));
filter.series = register('filterSeries', buildFilter(each.series));


function buildFilter (_each) {
  return function (handler, promises) {
    var filtered = [];
    
    return _each(function (promise, idx) {
      return handler(promise, idx).then(function (passed) {
        if (passed) filtered.push(promise);
      });
    }, promises).then(function () {
      return all(filtered);
    });
  }
}

module.exports = filter;