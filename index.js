var Promise = require('promise');
var isPromise = require('is-promise');
var asArray = require('as-array');
var extend = require('extend');
var defaults = require('defaults');
var flatten = require('flat-arguments');

var lag = {
  _promiseFirst: false,
  _functionFirst: true
};

// (fn, promise) syntax
lag._method = function (name, fn) {
  var method = this[name] = this._partialize(fn);
  return method;
};

// unlimted arguments syntax, but only one passed to initial partial
lag._partializedMethod = function (name, fn) {
  return lag[name] = function () {
    if (arguments.length === 1) {
      return lag.partial(function () {
        return lag[name].apply(null, asArray(arguments));
      }, arguments[0]);
    }
    
    return fn.apply(null, asArray(arguments));
  };
};

lag._args = function (args) {
  
  // TODO: wow, make this less ugly
  
  var _args =  {
    fn: (args[0] && args[0].fn) // are the args an object?
      ? args[0].fn
      : args[0],
    promises: (args[0] && args[0].promises) // are the args an object?
      ? args[0].promises
      : args[1]
  };
  
  if (lag._promiseFirst) {
    var fn = _args.fn;
    var promises = _args.promises;
    
    _args = {
      fn: promises,
      promises: fn
    };
  }
  
  // Trun all values into promises
  if (_args.promises) {
    _args.promises = asArray(_args.promises).map(lag.asPromise);
  }
  
  return _args;
};

lag.promise = function (fn) {
  fn = fn || function () {};
  return new Promise(fn);
};

lag.asPromise = function (value) {
  return Promise.from(value);
};

lag.all = function () {
  return Promise.all.apply(Promise, asArray(arguments));
};

lag.partial = function () {
  var partialArgs = asArray(arguments);
  var fn = partialArgs.shift();
  
  return function () {
    var appliedArgs = asArray(arguments);
    return fn.apply(fn, partialArgs.concat(appliedArgs));
  };
};

lag.identity = function () {
  return arguments[0];
};

lag.boolean = function (promise) {
  return lag
    .asPromise(promise)
    .then(function (val) {
      return lag.asPromise(!!val);
    });
};

lag.inverseBoolean = function (promise) {
  return lag.asPromise(promise)
    .then(lag.boolean)
    .then(function (val) {
      return lag.asPromise(!val);
    });
};

lag.compose = function () {
  var fns = asArray(arguments).reverse();
  
  return function (promises) {
    return lag.promise(function (resolve, reject) {
      executeFunction(promises)

      function executeFunction (promises) {
        var fn = fns.shift();
        
        return fn
          ? fn(promises).then(executeFunction, reject)
          : resolve(lag.asPromise(promises));
      };
    });
  };
};

lag._partialize = function (callback) {
  return function () {
    var args = lag._args(arguments);
    
    args.fn = args.fn || function (promise, resolve) {resolve();};
    
    if (!args.promises) return lag.partial(function (fn, promises) {
      var args = lag._args(arguments);
      return callback(args);
    }, args.fn);
      
    return callback(args);
  };
};

lag.promiseFirst = function () {
  lag._promiseFirst = true;
  lag._functionFirst = false;
};

lag.functionFirst = function () {
  lag._promiseFirst = false;
  lag._functionFirst = true;
};

// Arrays

lag._method('each', function (args) {
  var eachPromises = args.promises.map(function (promise, idx) {
    return args.fn(promise, idx);
  });
  
  return lag.all(eachPromises);  
});

lag._method('eachSeries', function (args) {  var _shouldExit = false;
  var currentPromise = lag.asPromise(true);
  var promises = args.promises.map(function (promise, idx) {
    return currentPromise = currentPromise.then(function () {
      return args.fn(promise, idx);
    })
  });
    
  return lag.all(promises);
});


['map', 'mapSeries'].forEach(function (name) {
  lag._method(name, function (args) {
    return lag.promise(function (resolve, reject) {
      var mapped = [];
      var each = (name === 'map') ? 'each' : 'eachSeries';
      
      lag[each](function (promise, idx) {
        return args.fn(promise, idx).then(mapped.push.bind(mapped), reject);
      }, args.promises).then(function () {
        lag.all(mapped).then(resolve);
      }, reject);
    });
  });
});


lag._method('reduce', function (args) {
  return lag.promise(function (resolve, reject) {
    var accum = args.promises.shift();
    
    lag.eachSeries(function (promise, idx) {
      return lag.promise(function (resolve, reject) {
        args.fn(accum, promise, idx).then(function (val) {
          accum = lag.asPromise(val);
          resolve();
        }, reject);
      });
    }, args.promises).then(function () {
      resolve(accum);
    }, reject);
  });
});

lag._method('reduceRight', function (args) {
  args.promises = args.promises.reverse();
  return lag.reduce(args);
});

['filter', 'filterSeries'].forEach(function (name) {
  lag._method(name, function (args) {
    return lag.promise(function (resolve, reject) {
      var filtered = [];
      var each = (name === 'filter') ? 'each' : 'eachSeries';
      
      lag[each](function (promise, idx) {
        return args.fn(promise, idx).then(function (passed) {
          if (passed) filtered.push(promise);
        }, reject);
      }, args.promises).then(function () {
        lag.all(filtered).then(resolve);
      }, reject);
    });
  });
});

['reject', 'rejectSeries'].forEach(function (name) {
  lag._method(name, function (args) {
    var filter = (name === 'reject') ? 'filter' : 'filterSeries';
    
    return lag[filter](function (promise, idx) {
      return args.fn(promise, idx)
        .then(lag.inverseBoolean);
    }, args.promises);
  });
});


['find', 'findSeries'].forEach(function (name) {
  lag._method(name, function (args) {
    return lag.promise(function (resolve, reject) {
      var wanted;
      var each = (name === 'find') ? 'each': 'eachSeries';
      
      
      lag[each](function (promise, idx) {
        var self = this;
        return args.fn(promise, idx).then(function (passed) {
          
          // FIXME: this leaves some promises hanging
          // when no values match
          
          // if (passed && !wanted) resolve(promise);
          if (passed && !wanted) wanted = promise;
        }, reject);
      }, args.promises).then(function () {
        resolve(wanted);
      });
      
      
    });
  });
});


lag.compact = lag.filter(lag.boolean);

lag.first = function (promises) {
  return lag.asPromise(asArray(promises).shift());
};

lag.last = function (promises) {
  return lag.asPromise(promises.pop());
};

lag.initial = function (promises) {
  return lag.all(promises.slice(0, promises.length-1));
};

lag.rest = function (promises) {
  return lag.all(promises.slice(1));
};

// Collections

lag._method('pluck', function (args) {
  return lag.promise(function (resolve, reject) {
    lag.all(args.promises).then(function (res) {
      resolve(res.map(function (obj) {
        return obj[args.fn];
      }));
    }, reject);
  });
});

['where', 'findWhere'].forEach(function (name) {
  lag._method(name, function (args) {
    var where = args.fn;
    var keys = Object.keys(where);
    var find = (name === 'where') ? 'filter': 'find';
    
    return lag[find](function (promise) {
      return promise.then(function (obj) {
        var matching = false;
        
        keys.forEach(function (key) {
          if (obj[key] === where[key]) matching = true;
        });
        
        return lag.asPromise(matching);
        });
    }, args.promises)
  });
});

lag.every = function (promises) {
  return lag.compact(promises).then(function (compacted) {
    return lag.asPromise(promises.length === compacted.length);
  });
};

lag.some = function (promises) {
  return lag
    .find(lag.boolean, promises)
    .then(lag.boolean);
};

lag._method('contains', function (args) {
  var value = args.fn;
  
  return lag
    .find(lag.equal(value), args.promises)
    .then(lag.boolean);
});

// Objects

lag.keys = function (promise) {
  return lag.first(promise)
    .then(function (obj) {
      return lag.asPromise(Object.keys(obj));
    });
};


lag.values = function (promise) {
  return lag.first(promise)
    .then(function (obj) {
      var values = Object.keys(obj).map(function (key) {
        return obj[key];
      });
    
      return lag.asPromise(values);
    });
};

lag._partializedMethod('extend', function () {
  return lag
    .map(lag.identity, flatten(arguments))
    .then(function (objects) {
      return lag.asPromise(extend.apply(null, objects));
    });
});

lag._partializedMethod('defaults', function () {
  return lag
    .map(lag.identity, flatten(arguments).reverse())
    .then(function (objects) {
      return lag.asPromise(defaults.apply(null, objects));
    });
});

// Utilities

lag._method('equal', function (args) {
  return lag
    .all(args.fn, args.promises[0])
    .then(function (values) {
      return lag.asPromise(values[0] === values[1]);
    });
});

lag.log = function (promise) {
  return promise.then(function (val) {
    console.log(val);
    return lag.asPromise(val);
  });
};

module.exports = lag;