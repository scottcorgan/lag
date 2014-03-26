var asArray = require('as-array');

var _ = Object.create(null);

// Main method to create new, partialized methods
var register = require('./lib/register');
_.register = function (name, fn, options) {
  return _[name] = register(name, fn, options);
};

_.promise = require('./lib/promise');
_.all = require('./lib/all');
_.partial = require('./lib/partial');
_.identity = require('./lib/identity');
_.boolean = require('./lib/boolean');
_.inverseBoolean = require('./lib/inverse_boolean');
_.compose = require('./lib/compose');

// Arrays

// TODO: combine the "series" and "parallel" versions

_.each = require('./lib/each');
_.eachSeries = require('./lib/each_series');
_.map = require('./lib/map');
_.mapSeries = require('./lib/map_series');
_.reduce = require('./lib/reduce');
_.reduceRight = require('./lib/reduce_right');
_.filter = require('./lib/filter');
_.filterSeries = require('./lib/filter_series');
_.reject = require('./lib/reject');
_.rejectSeries = require('./lib/reject_series');
_.find = require('./lib/find');
_.findSeries = require('./lib/find_series');
_.max = require('./lib/max');
_.min = require('./lib/min');
_.sortBy = require('./lib/sort_by');
_.at = require('./lib/at');
_.compact = require('./lib/compact');
_.first = require('./lib/first');
_.firstValue = _.first.value;
_.last = require('./lib/last');
_.lastValue = _.last.value;
_.initial = require('./lib/initial');
_.initialValues = _.initial.values;
_.tail = require('./lib/tail');
_.tailValues = _.tail.values;
_.reverse = require('./lib/reverse');
_.reverseValues = _.reverse.values;

// Collections

_.where = require('./lib/where');
_.findWhere = require('./lib/find_where');
_.pluck = require('./lib/pluck');
_.every = require('./lib/every');
_.some = require('./lib/some');
_.contains = require('./lib/contains');

// Objects

_.keys = require('./lib/keys');
_.values = require('./lib/values');
_.extend = require('./lib/extend');
_.defaults = require('./lib/defaults');
_.pick = require('./lib/pick');
_.omit = require('./lib/omit');
_.zipObject = require('./lib/zip_object');

// Strings

_.register('prepend', function (stringToPrepend, promise) {
  return _.first(promise).then(function (val) {
    return _.promise('' + stringToPrepend + val + '');
  });
});

_.register('append', function (stringToAppend, promise) {
  return _.first(promise).then(function (val) {
    return _.promise('' + val + stringToAppend + '');
  });
});

// Utilities

_.equal = require('./lib/equal');

// _.register('equal', operateOnValues(function (a, b) {
//   return a === b;
// }));

_.register('greaterThan', operateOnValues(function (a, b) {
  return a < b;
}));

_.register('lessThan', operateOnValues(function (a, b) {
  return a > b;
}));

_.register('add', operateOnValues(function (a, b) {
  return a + b;
}));

_.register('subtract', operateOnValues(function (a, b) {
  return b - a;
}));

function operateOnValues(operation) {
  return function (value1, value2) {
    return _.all(value1, value2).then(function (values) {
      return _.promise(operation(values[0], values[1]));
    });
  };
}

_.log = function (promise) {
  return promise.then(function (val) {
    console.log(val);
    return _.promise(val);
  });
};

module.exports = _;

function defaults (options, defaults) {
  options = options || {};

  Object.keys(defaults).forEach(function(key) {
    if (typeof options[key] === 'undefined') {
      options[key] = defaults[key];
    }
  });

  return options;
};