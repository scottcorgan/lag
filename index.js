var Promise = require('promise');
var isPromise = require('is-promise');
var asArray = require('as-array');
var extend = require('extend');
var defaults = require('defaults');
var flatten = require('flat-arguments');

var underpromise = {
  _promiseFirst: false,
  _functionFirst: true
};

// (fn, promise) syntax
underpromise._method = function (name, fn) {
  var method = this[name] = this._partialize(fn);
  return method;
};

// unlimted arguments syntax, but only one passed to initial partial
underpromise._partializedMethod = function (name, fn) {
  return underpromise[name] = function () {
    if (arguments.length === 1) {
      return underpromise.partial(function () {
        return underpromise[name].apply(null, asArray(arguments));
      }, arguments[0]);
    }
    
    return fn.apply(null, asArray(arguments));
  };
};

underpromise._args = function (args) {
  
  // TODO: wow, make this less ugly
  
  var _args =  {
    fn: (args[0] && args[0].fn) // are the args an object?
      ? args[0].fn
      : args[0],
    promises: (args[0] && args[0].promises) // are the args an object?
      ? args[0].promises
      : args[1]
  };
  
  if (underpromise._promiseFirst) {
    var fn = _args.fn;
    var promises = _args.promises;
    
    _args = {
      fn: promises,
      promises: fn
    };
  }
  
  // Trun all values into promises
  if (_args.promises) {
    _args.promises = asArray(_args.promises).map(underpromise.asPromise);
  }
  
  return _args;
};

underpromise.promise = function (fn) {
  fn = fn || function () {};
  return new Promise(fn);
};

underpromise.asPromise = function (value) {
  return Promise.from(value);
};

underpromise.all = function () {
  return Promise.all.apply(Promise, asArray(arguments));
};

underpromise.partial = function () {
  var partialArgs = asArray(arguments);
  var fn = partialArgs.shift();
  
  return function () {
    var appliedArgs = asArray(arguments);
    return fn.apply(fn, partialArgs.concat(appliedArgs));
  };
};

underpromise.identity = function () {
  return arguments[0];
};

underpromise.boolean = function (promise) {
  return underpromise
    .asPromise(promise)
    .then(function (val) {
      return underpromise.asPromise(!!val);
    });
};

underpromise.inverseBoolean = function (promise) {
  return underpromise.asPromise(promise)
    .then(underpromise.boolean)
    .then(function (val) {
      return underpromise.asPromise(!val);
    });
};

underpromise.compose = function () {
  var fns = asArray(arguments).reverse();
  
  return function (promises) {
    return underpromise.promise(function (resolve, reject) {
      executeFunction(promises)

      function executeFunction (promises) {
        var fn = fns.shift();
        
        return fn
          ? fn(promises).then(executeFunction, reject)
          : resolve(underpromise.asPromise(promises));
      };
    });
  };
};

underpromise._partialize = function (callback) {
  return function () {
    var args = underpromise._args(arguments);
    
    args.fn = args.fn || function (promise, resolve) {resolve();};
    
    if (!args.promises) return underpromise.partial(function (fn, promises) {
      var args = underpromise._args(arguments);
      return callback(args);
    }, args.fn);
      
    return callback(args);
  };
};

underpromise.promiseFirst = function () {
  underpromise._promiseFirst = true;
  underpromise._functionFirst = false;
};

underpromise.functionFirst = function () {
  underpromise._promiseFirst = false;
  underpromise._functionFirst = true;
};

// Arrays

underpromise._method('each', function (args) {
  var eachPromises = args.promises.map(function (promise, idx) {
    return args.fn(promise, idx);
  });
  
  return underpromise.all(eachPromises);  
});

underpromise._method('eachSeries', function (args) {  var _shouldExit = false;
  var currentPromise = underpromise.asPromise(true);
  var promises = args.promises.map(function (promise, idx) {
    return currentPromise = currentPromise.then(function () {
      return args.fn(promise, idx);
    })
  });
    
  return underpromise.all(promises);
});


['map', 'mapSeries'].forEach(function (name) {
  underpromise._method(name, function (args) {
    return underpromise.promise(function (resolve, reject) {
      var mapped = [];
      var each = (name === 'map') ? 'each' : 'eachSeries';
      
      underpromise[each](function (promise, idx) {
        return args.fn(promise, idx).then(mapped.push.bind(mapped), reject);
      }, args.promises).then(function () {
        underpromise.all(mapped).then(resolve);
      }, reject);
    });
  });
});


underpromise._method('reduce', function (args) {
  return underpromise.promise(function (resolve, reject) {
    var accum = args.promises.shift();
    
    underpromise.eachSeries(function (promise, idx) {
      return underpromise.promise(function (resolve, reject) {
        args.fn(accum, promise, idx).then(function (val) {
          accum = underpromise.asPromise(val);
          resolve();
        }, reject);
      });
    }, args.promises).then(function () {
      resolve(accum);
    }, reject);
  });
});

underpromise._method('reduceRight', function (args) {
  args.promises = args.promises.reverse();
  return underpromise.reduce(args);
});

['filter', 'filterSeries'].forEach(function (name) {
  underpromise._method(name, function (args) {
    return underpromise.promise(function (resolve, reject) {
      var filtered = [];
      var each = (name === 'filter') ? 'each' : 'eachSeries';
      
      underpromise[each](function (promise, idx) {
        return args.fn(promise, idx).then(function (passed) {
          if (passed) filtered.push(promise);
        }, reject);
      }, args.promises).then(function () {
        underpromise.all(filtered).then(resolve);
      }, reject);
    });
  });
});

['reject', 'rejectSeries'].forEach(function (name) {
  underpromise._method(name, function (args) {
    var filter = (name === 'reject') ? 'filter' : 'filterSeries';
    
    return underpromise[filter](function (promise, idx) {
      return args.fn(promise, idx)
        .then(underpromise.inverseBoolean);
    }, args.promises);
  });
});


['find', 'findSeries'].forEach(function (name) {
  underpromise._method(name, function (args) {
    return underpromise.promise(function (resolve, reject) {
      var wanted;
      var each = (name === 'find') ? 'each': 'eachSeries';
      
      
      underpromise[each](function (promise, idx) {
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


underpromise.compact = underpromise.filter(underpromise.boolean);

underpromise.first = function (promises) {
  return underpromise.asPromise(asArray(promises).shift());
};

underpromise.last = function (promises) {
  return underpromise.asPromise(promises.pop());
};

underpromise.initial = function (promises) {
  return underpromise.all(promises.slice(0, promises.length-1));
};

underpromise.rest = function (promises) {
  return underpromise.all(promises.slice(1));
};

// Collections

underpromise._method('pluck', function (args) {
  return underpromise.promise(function (resolve, reject) {
    underpromise.all(args.promises).then(function (res) {
      resolve(res.map(function (obj) {
        return obj[args.fn];
      }));
    }, reject);
  });
});

['where', 'findWhere'].forEach(function (name) {
  underpromise._method(name, function (args) {
    var where = args.fn;
    var keys = Object.keys(where);
    var find = (name === 'where') ? 'filter': 'find';
    
    return underpromise[find](function (promise) {
      return promise.then(function (obj) {
        var matching = false;
        
        keys.forEach(function (key) {
          if (obj[key] === where[key]) matching = true;
        });
        
        return underpromise.asPromise(matching);
        });
    }, args.promises)
  });
});

underpromise.every = function (promises) {
  return underpromise.compact(promises).then(function (compacted) {
    return underpromise.asPromise(promises.length === compacted.length);
  });
};

underpromise.some = function (promises) {
  return underpromise
    .find(underpromise.boolean, promises)
    .then(underpromise.boolean);
};

underpromise._method('contains', function (args) {
  var value = args.fn;
  
  return underpromise
    .find(underpromise.equal(value), args.promises)
    .then(underpromise.boolean);
});

// Objects

underpromise.keys = function (promise) {
  return underpromise.first(promise)
    .then(function (obj) {
      return underpromise.asPromise(Object.keys(obj));
    });
};


underpromise.values = function (promise) {
  return underpromise.first(promise)
    .then(function (obj) {
      var values = Object.keys(obj).map(function (key) {
        return obj[key];
      });
    
      return underpromise.asPromise(values);
    });
};

underpromise._partializedMethod('extend', function () {
  return underpromise
    .map(underpromise.identity, flatten(arguments))
    .then(function (objects) {
      return underpromise.asPromise(extend.apply(null, objects));
    });
});

underpromise._partializedMethod('defaults', function () {
  return underpromise
    .map(underpromise.identity, flatten(arguments).reverse())
    .then(function (objects) {
      return underpromise.asPromise(defaults.apply(null, objects));
    });
});

// Utilities

underpromise._method('equal', function (args) {
  return underpromise
    .all(args.fn, args.promises[0])
    .then(function (values) {
      return underpromise.asPromise(values[0] === values[1]);
    });
});

underpromise.log = function (promise) {
  return promise.then(function (val) {
    console.log(val);
    return underpromise.asPromise(val);
  });
};

module.exports = underpromise;