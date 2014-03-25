var Promise = require('promise');
var asArray = require('as-array');
var extend = require('extend');
var flatten = require('flat-arguments');
var zipObject = require('zip-object');



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

['where', 'findWhere'].forEach(function (name) {
  _.register(name, function (matchers, promises) {
    var keys = Object.keys(matchers);
    var find = (name === 'where') ? 'filter': 'find';
    
    return _[find](function (promise) {
      return promise.then(function (obj) {
        var matching = false;
        
        keys.forEach(function (key) {
          if (obj[key] === matchers[key]) matching = true;
        });
        
        return _.promise(matching);
      });
    }, promises)
  });
});

_.register('pluck', function (key, promises) {
  return _.all(promises).then(function (res) {
    return _.promise(res.map(function (obj) {
      return obj[key];
    }));
  });
});

_.every = function (promises) {
  return _.compact(promises).then(function (compacted) {
    return _.promise(promises.length === compacted.length);
  });
};

_.some = function (promises) {
  return _
    .find(_.boolean, promises)
    .then(_.boolean);
};

_.register('contains', function (value, promises) {
  return _.find(_.equal(value), promises)
    .then(_.boolean);
});

// Objects

_.keys = function (promise) {
  return _.promise(_.first(promise).then(Object.keys));
};


_.values = function (promise) {
  return _.first(promise)
    .then(function (obj) {
      var values = Object.keys(obj).map(function (key) {
        return obj[key];
      });
    
      return _.promise(values);
    });
};

_.register('extend', function () {
  return _
    .map(_.identity, flatten(arguments))
    .then(function (objects) {
      return _.promise(extend.apply(null, objects));
    });
}, {
  parital: false
});

_.register('defaults', function () {
  return _
    .map(_.identity, flatten(arguments).reverse())
    .then(function (objects) {
      return _.promise(defaults.apply(null, objects));
    });
}, {
  partial: false
});

_.register('pick', function (keys, promise) {
  var returnObj = {};
  
  return _.all(promise, _.all(keys)).then(function (results) {
    var obj = results[0];
    var resolvedKeys = results[1];
    
    resolvedKeys.forEach(function (key) {
      returnObj[key] = obj[key];
    });
    
    return _.promise(returnObj);
  });
});

_.register('omit', function (keys, promise) {
  return _.all(promise, _.all(keys)).then(function (results) {
    var obj = results[0];
    var keysToRemove = results[1];
      
    var keys = _.reject(function (key) {
      return _.contains(key, keysToRemove);
    }, Object.keys(obj));
    
    return _.pick(keys, obj);
  });
});

_.register('zipObject', function (arr1, arr2) {
  return _.all(arr1, arr2)
    .then(function (values) {
      return _.promise(zipObject.apply(null, values));
    });
}, {
  partial: false
});

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

_.register('equal', operateOnValues(function (a, b) {
  return a === b;
}));

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