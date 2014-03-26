var register = require('./register');
var each = require('./each');
var all = require('./all');

var map = register('map', buildMap(each));
map.series = register('mapSeries', buildMap(each.series));

function buildMap (_each) {
  return function (handler, promises) {
    var mapped = [];
    
    return _each(function (promise, idx) {
      return handler(promise, idx).then(mapped.push.bind(mapped));
    }, promises).then(function () {
      return all(mapped);
    });
  };
}

module.exports = map;