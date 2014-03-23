var Promise = require('promise');
var asArray = require('as-array');
var extend = require('extend');
var flatten = require('flat-arguments');
var zipObject = require('zip-object');

var _ = {
  _promiseFirst: false,
  _functionFirst: true
};

// (fn, promise) syntax
_._method = function (name, fn) {
  var method = this[name] = this._partialize(fn);
  return method;
};

// unlimited arguments syntax, but only one passed to initial partial
_._partializedMethod = function (name, fn) {
  return _[name] = function () {
    // if (arguments.length === 1) {
      
    var args = flatten(asArray(arguments));
    
    // Promises or functions first?
    if (_._promiseFirst) args = args.reverse();
    
    // If last argument isn't a promise, this is a partial
    if (args.length === 1) {
      return _.partial(function () {
        return _[name].apply(null, asArray(arguments));
      }, args);
    }
    
    return fn.apply(null, args);
  };
};

_._fnFromArgs = function (args) {
  var fn;
  
  if (_._promiseFirst) fn = args[args.length - 1];
  else fn = args[0];
  
  return fn;
};

_._promisesFromArgs = function (args) {
  var promises;
  
  if (!args[1]) return; // No promises
  if (_._promiseFirst) promises =  flatten([].slice.call(args, 0, args.length -1));
  else promises = flatten([].slice.call(args, 1));
  
  return promises;
};

_._args = function (args) {
  var _args = {};
  
  // object
  if (args[0] && args[0].fn) {
    _args.fn = args[0].fn;
    _args.promises = asArray(args[0].promises);
  }
  
  // probably multiple arguments
  if (args.length >= 1 && !args[0].fn) {
    _args.fn = _._fnFromArgs(args);
    _args.promises = _._promisesFromArgs(args);
  }
  
  // Trun all values into promises
  if (_args.promises) {
    _args.promises = asArray(_args.promises).map(_.asPromise);
  }
  
  return _args;
};

_._partialize = function (callback) {
  return function () {
    var args = _._args(arguments);
    
    args.fn = args.fn || function (promise, resolve) {resolve();};
    
    if (!args.promises) return _.partial(function (fn, promises) {
      var args = _._args(arguments);
      return callback(args);
    }, args.fn);
      
    return callback(args);
  };
};

_.promise = function (fn) {
  return new Promise(fn || function () {});
};

_.asPromise = function (value) {
  return Promise.from(value);
};

_.all = function () {
  return Promise.all.apply(Promise, asArray(arguments));
};

_.partial = function () {
  var partialArgs = asArray(arguments);
  var fn = partialArgs.shift();
  
  return function () {
    var appliedArgs = asArray(arguments);
    return fn.apply(fn, partialArgs.concat(appliedArgs));
  };
};

_.identity = function () {
  return arguments[0];
};

_.boolean = function (promise) {
  return _
    .asPromise(promise)
    .then(function (val) {
      return _.asPromise(!!val);
    });
};

_.inverseBoolean = function (promise) {
  return _.asPromise(promise)
    .then(_.boolean)
    .then(function (val) {
      return _.asPromise(!val);
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
          : resolve(_.asPromise(promises));
      };
    });
  };
};

_._isPromise = function (obj) {
  return obj && typeof obj.then === 'function';
};

_.promiseFirst = function () {
  _._promiseFirst = true;
  _._functionFirst = false;
};

_.functionFirst = function () {
  _._promiseFirst = false;
  _._functionFirst = true;
};

// Arrays

_._method('each', function (args) {
  var eachPromises = args.promises.map(function (promise, idx) {
    return args.fn(promise, idx);
  });
  
  return _.all(eachPromises);  
});

_._method('eachSeries', function (args) {  var _shouldExit = false;
  var currentPromise = _.asPromise(true);
  var promises = args.promises.map(function (promise, idx) {
    return currentPromise = currentPromise.then(function () {
      return args.fn(promise, idx);
    })
  });
    
  return _.all(promises);
});


['map', 'mapSeries'].forEach(function (name) {
  _._method(name, function (args) {
    var mapped = [];
    var each = (name === 'map') ? 'each' : 'eachSeries';
    
    return _[each](function (promise, idx) {
      return args.fn(promise, idx).then(mapped.push.bind(mapped));
    }, args.promises).then(function () {
      return _.all(mapped);
    });
  });
});


_._method('reduce', function (args) {
  var accum = args.promises.shift();
  
  return _.eachSeries(function (promise, idx) {
    return _.promise(function (resolve, reject) {
      args.fn(accum, promise, idx).then(function (val) {
        accum = _.asPromise(val);
        resolve();
      });
    });
  }, args.promises).then(function () {
    return _.asPromise(accum);
  });
});

_._method('reduceRight', function (args) {
  args.promises = args.promises.reverse();
  return _.reduce(args);
});

['filter', 'filterSeries'].forEach(function (name) {
  _._method(name, function (args) {
    var filtered = [];
    var each = (name === 'filter') ? 'each' : 'eachSeries';
    
    return _[each](function (promise, idx) {
      return args.fn(promise, idx).then(function (passed) {
        if (passed) filtered.push(promise);
      });
    }, args.promises).then(function () {
      return _.all(filtered);
    });
  });
});

['reject', 'rejectSeries'].forEach(function (name) {
  _._method(name, function (args) {
    var filter = (name === 'reject') ? 'filter' : 'filterSeries';
    
    return _[filter](function (promise, idx) {
      return args.fn(promise, idx)
        .then(_.inverseBoolean);
    }, args.promises);
  });
});


['find', 'findSeries'].forEach(function (name) {
  _._method(name, function (args) {
    var wanted;
    var each = (name === 'find') ? 'each': 'eachSeries';
    
    return _[each](function (promise, idx) {
      return args.fn(promise, idx).then(function (passed) {
        
        // FIXME: this leaves some promises hanging
        // when no values match
        
        // if (passed && !wanted) resolve(promise);
        if (passed && !wanted) wanted = promise;
      });
    }, args.promises).then(function () {
      return _.asPromise(wanted);
    });
  });
});


_.compact = _.filter(_.boolean);

_.first = function (promises) {
  return _.asPromise(asArray(promises)[0]);
};

_.firstValue = function (promise) {
  return _.first(promise).then(function (arr) {
    return _.asPromise(asArray(arr)[0]);
  });
};

_.last = function (promises) {
  return _.asPromise(promises[promises.length - 1]);
};

_.lastValue = function (promise) {
  return _.first(promise).then(function (arr) {
    arr = asArray(arr);
    return _.asPromise(arr[arr.length - 1]);
  });
};

_.initial = function (promises) {
  return _.all(promises.slice(0, promises.length-1));
};

_.initialValues = function (promise) {
  return _.first(promise).then(function (arr) {
    arr = asArray(arr);
    return _.asPromise(arr.slice(0, arr.length-1));
  });
};

_.tail = function (promises) {
  return _.all(promises.slice(1));
};

_.tailValues = function (promise) {
  return _.first(promise).then(function (arr) {
    arr = asArray(arr);
    return _.asPromise(arr.slice(1));
  });
};

_.reverse = function (promises) {
  return _.all(promises.reverse());
};

_.reverseValues = function (promise) {
  return _.first(promise).then(function (arr) {
    return _.asPromise(arr.reverse());
  });
};

// Collections

['where', 'findWhere'].forEach(function (name) {
  _._method(name, function (args) {
    var where = args.fn;
    var keys = Object.keys(where);
    var find = (name === 'where') ? 'filter': 'find';
    
    return _[find](function (promise) {
      return promise.then(function (obj) {
        var matching = false;
        
        keys.forEach(function (key) {
          if (obj[key] === where[key]) matching = true;
        });
        
        return _.asPromise(matching);
        });
    }, args.promises)
  });
});

_._method('pluck', function (args) {
  return _.all(args.promises).then(function (res) {
    return _.asPromise(res.map(function (obj) {
      return obj[args.fn];
    }));
  });
});

_.every = function (promises) {
  return _.compact(promises).then(function (compacted) {
    return _.asPromise(promises.length === compacted.length);
  });
};

_.some = function (promises) {
  return _
    .find(_.boolean, promises)
    .then(_.boolean);
};

_._method('contains', function (args) {
  var value = args.fn;
  
  return _
    .find(_.equal(value), args.promises)
    .then(_.boolean);
});

// Objects

_.keys = function (promise) {
  return _.first(promise)
    .then(function (obj) {
      return _.asPromise(Object.keys(obj));
    });
};


_.values = function (promise) {
  return _.first(promise)
    .then(function (obj) {
      var values = Object.keys(obj).map(function (key) {
        return obj[key];
      });
    
      return _.asPromise(values);
    });
};

_._partializedMethod('extend', function () {
  return _
    .map(_.identity, flatten(arguments))
    .then(function (objects) {
      return _.asPromise(extend.apply(null, objects));
    });
});

_._partializedMethod('defaults', function () {
  return _
    .map(_.identity, flatten(arguments).reverse())
    .then(function (objects) {
      return _.asPromise(defaults.apply(null, objects));
    });
});

// TODO: make these
// _._methodWithMultipleFns
// _._methodWithMultiplePromises

_._partializedMethod('pick', function () {
  var args = asArray(arguments);
  
  return _.last(args).then(function (obj) {
    return _.initial(args).then(function (keys) {
      var returnObj = {};
      
      keys.forEach(function (key) {
        returnObj[key] = obj[key];
      });
      
      return _.asPromise(returnObj);
    });
  });
});

_._partializedMethod('omit', function () {
  var args = asArray(arguments);
  
  return _.last(args).then(function (obj) {
    return _.initial(args).then(function (keysToRemove) {      
      
      var keys = _.reject(function (key) {
        return _.contains(key, keysToRemove);
      }, Object.keys(obj));
      
      return _.pick(keys, obj);
    });
  });
});

_.zipObject = function (arr1, arr2) {
  return _.all(arr1, arr2)
    .then(function (values) {
      return _.asPromise(zipObject.apply(null, values));
    });
};

// Utilities

_._method('equal', operateOnValues(function (a, b) {
  return a === b;
}));

_._method('greaterThan', operateOnValues(function (a, b) {
  return a < b;
}));

_._method('lessThan', operateOnValues(function (a, b) {
  return a > b;
}));

_._method('add', operateOnValues(function (a, b) {
  return a + b;
}));

_._method('subtract', operateOnValues(function (a, b) {
  return b - a;
}));

function operateOnValues(operation) {
  return function (args) {
    return _.all(args.fn, args.promises[0]).then(function (values) {
      return _.asPromise(operation(values[0], values[1]));
    });
  };
}

_.log = function (promise) {
  return promise.then(function (val) {
    console.log(val);
    return _.asPromise(val);
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