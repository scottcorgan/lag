var Promise = require('promise');
var asArray = require('as-array');
var extend = require('extend');
var flatten = require('flat-arguments');
var zipObject = require('zip-object');

var _ = {
  _promiseFirst: false,
  _functionFirst: true
};

_.register = function (name, fn, options) {
  options = options || {};
  
  _[name] = function (handler, value) {
    var args = asArray(arguments);
    
    // All arguments
    if (args.length > 1 && !options.partial) return fn.apply(null, args);    
    
    // Partial handler
    args.unshift(fn);
    return _.partial.apply(null, args);
  };
};

_.promise = function (value) {
  if (typeof value === 'function') return new Promise(value);
  return _.promiseFrom(value);
};

_.promiseFrom = function (value) {
  return Promise.from(value);
};

_.all = function () {
  return Promise.all.apply(null, asArray(arguments));
};

_.partial = function () {
  var partialArgs = asArray(arguments);
  var fn = partialArgs.shift();
  
  return function () {
    var appliedArgs = asArray(arguments);
    return fn.apply(null, partialArgs.concat(appliedArgs));
  };
};

_.identity = function () {
  return _.promise(arguments[0]);
};

_.boolean = function (promise) {
  return _
    .promise(promise)
    .then(function (val) {
      return _.promise(!!val);
    });
};

_.inverseBoolean = function (promise) {
  return _.promise(promise)
    .then(_.boolean)
    .then(function (val) {
      return _.promise(!val);
    });
};

_.compose = function () {
  var fns = asArray(arguments).reverse();
  
  return function (promises) {
    return _.promise(function (resolve, reject) {
      executeFunction(promises)

      function executeFunction (promises) {
        var fn = fns.shift();
        
        return fn
          ? fn(promises).then(executeFunction, reject)
          : resolve(_.promise(promises));
      };
    });
  };
};

_.isPromise = function (value) {
  return value && typeof value.then === 'function';
};

// Arrays

_.register('each', function (handler, promises) {
  return _.all(asArray(promises).map(function (value, idx) {
    return handler(_.promise(value), idx);
  }));
});

_.register('eachSeries', function (handler, promises) {
  var currentPromise = _.promise(true);
  var p = asArray(promises).map(function (promise, idx) {
    return currentPromise = currentPromise.then(function () {
      return handler(_.promise(promise), idx);
    });
  });
    
  return _.all(p);
});


['map', 'mapSeries'].forEach(function (name) {
  _.register(name, function (handler, promises) {
    var mapped = [];
    var each = (name === 'map') ? 'each' : 'eachSeries';
    
    return _[each](function (promise, idx) {
      return handler(promise, idx).then(mapped.push.bind(mapped));
    }, promises).then(function () {
      return _.all(mapped);
    });
  });
});


_.register('reduce', function (handler, promises) {
  promises = asArray(promises);
  
  var accum = promises.shift();
  
  return _.eachSeries(function (promise, idx) {
    return _.promise(function (resolve, reject) {
      handler(accum, promise, idx).then(function (val) {
        accum = _.promise(val);
        resolve();
      });
    });
  }, promises).then(function () {
    return _.promise(accum);
  });
});

_.register('reduceRight', function (handler, promises) {
  return _.reduce(handler, asArray(promises).reverse());
});

['filter', 'filterSeries'].forEach(function (name) {
  _.register(name, function (handler, promises) {
    var filtered = [];
    var each = (name === 'filter') ? 'each' : 'eachSeries';
    
    return _[each](function (promise, idx) {
      return handler(promise, idx).then(function (passed) {
        if (passed) filtered.push(promise);
      });
    }, promises).then(function () {
      return _.all(filtered);
    });
  });
});

['reject', 'rejectSeries'].forEach(function (name) {
  _.register(name, function (handler, promises) {
    var filter = (name === 'reject') ? 'filter' : 'filterSeries';
    
    return _[filter](function (promise, idx) {
      return handler(promise, idx)
        .then(_.inverseBoolean);
    }, promises);
  });
});


['find', 'findSeries'].forEach(function (name) {
  _.register(name, function (handler, promises) {
    var wanted;
    var each = (name === 'find') ? 'each': 'eachSeries';
    
    return _[each](function (promise, idx) {
      return handler(promise, idx).then(function (passed) {
        
        // FIXME: this leaves some promises hanging
        // when no values match
        
        // if (passed && !wanted) resolve(promise);
        if (passed && !wanted) wanted = promise;
      });
    }, promises).then(function () {
      return _.promise(wanted);
    });
  });
});


_.compact = _.filter(_.boolean);

_.first = function (promises) {
  return _.promise(asArray(promises)[0]);
};

_.firstValue = function (promise) {
  return _.first(promise).then(function (arr) {
    return _.promise(asArray(arr)[0]);
  });
};

_.last = function (promises) {
  return _.promise(promises[promises.length - 1]);
};

_.lastValue = function (promise) {
  return _.first(promise).then(function (arr) {
    arr = asArray(arr);
    return _.promise(arr[arr.length - 1]);
  });
};

_.initial = function (promises) {
  return _.all(promises.slice(0, promises.length-1));
};

_.initialValues = function (promise) {
  return _.first(promise).then(function (arr) {
    arr = asArray(arr);
    return _.promise(arr.slice(0, arr.length-1));
  });
};

_.tail = function (promises) {
  return _.all(promises.slice(1));
};

_.tailValues = function (promise) {
  return _.first(promise).then(function (arr) {
    arr = asArray(arr);
    return _.promise(arr.slice(1));
  });
};

_.reverse = function (promises) {
  return _.all(promises.reverse());
};

_.reverseValues = function (promise) {
  return _.first(promise).then(function (arr) {
    return _.promise(arr.reverse());
  });
};

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