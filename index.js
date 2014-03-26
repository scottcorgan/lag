var lag = Object.create(null);

lag.register = require('./lib/register');
lag.promise = require('./lib/promise');
lag.all = require('./lib/all');
lag.partial = require('./lib/partial');
lag.identity = require('./lib/identity');
lag.boolean = require('./lib/boolean');
lag.inverseBoolean = require('./lib/inverse_boolean');
lag.compose = require('./lib/compose');

// Arrays

lag.each = require('./lib/each');
lag.map = require('./lib/map');
lag.reduce = require('./lib/reduce');
lag.reduceRight = require('./lib/reduce_right');
lag.filter = require('./lib/filter');
lag.reject = require('./lib/reject');
lag.find = require('./lib/find');
lag.max = require('./lib/max');
lag.min = require('./lib/min');
lag.sortBy = require('./lib/sort_by');
lag.at = require('./lib/at');
lag.compact = require('./lib/compact');
lag.first = require('./lib/first');
lag.last = require('./lib/last');
lag.initial = require('./lib/initial');
lag.tail = require('./lib/tail');
lag.reverse = require('./lib/reverse');

// Collections

lag.where = require('./lib/where');
lag.findWhere = require('./lib/find_where');
lag.pluck = require('./lib/pluck');
lag.every = require('./lib/every');
lag.some = require('./lib/some');
lag.contains = require('./lib/contains');

// Objects

lag.keys = require('./lib/keys');
lag.values = require('./lib/values');
lag.extend = require('./lib/extend');
lag.defaults = require('./lib/defaults');
lag.pick = require('./lib/pick');
lag.omit = require('./lib/omit');
lag.zipObject = require('./lib/zip_object');

// Strings

lag.prepend = require('./lib/prepend');
lag.append = require('./lib/append');

// Utilities

lag.equal = require('./lib/equal');
lag.greaterThan = require('./lib/greater_than');
lag.lessThan = require('./lib/less_than');
lag.add = require('./lib/add');
lag.subtract = require('./lib/subtract');
lag.log = require('./lib/log');

module.exports = lag;