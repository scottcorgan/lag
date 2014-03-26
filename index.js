var _ = Object.create(null);

_.promise = require('./lib/promise');
_.all = require('./lib/all');
_.partial = require('./lib/partial');
_.identity = require('./lib/identity');
_.boolean = require('./lib/boolean');
_.inverseBoolean = require('./lib/inverse_boolean');
_.compose = require('./lib/compose');

// Arrays

_.each = require('./lib/each');
_.map = require('./lib/map');
_.reduce = require('./lib/reduce');
_.reduceRight = require('./lib/reduce_right');
_.filter = require('./lib/filter');
_.reject = require('./lib/reject');
_.find = require('./lib/find');
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

_.prepend = require('./lib/prepend');
_.append = require('./lib/append');

// Utilities

_.equal = require('./lib/equal');
_.greaterThan = require('./lib/greater_than');
_.lessThan = require('./lib/less_than');
_.add = require('./lib/add');
_.subtract = require('./lib/subtract');
_.log = require('./lib/log');

module.exports = _;