var compact = require('./compact');
var promise = require('./promise');

module.exports = function (promises) {
  return compact(promises).then(function (compacted) {
    return promise(promises.length === compacted.length);
  });
};