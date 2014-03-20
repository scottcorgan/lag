var Promise = require('promise');
var isPromise = require('is-promise');
var asArray = require('as-array');
var drainer = require('drainer');
var callbacker = require('callbacker');

var underpromise = {
  _promiseFirst: false,
  _functionFirst: true
};

underpromise._method = function (name, fn) {
  var method = this[name] = this._partialize(fn);
  return method;
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
  return underpromise.promise(function (resolve, reject) {
    underpromise.asPromise(promise).then(function (val) {
      resolve(!!val);
    }, reject);
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
    return args.fn(promise);
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

['find', 'findSeries'].forEach(function (name) {
  underpromise._method(name, function (args) {
    return underpromise.promise(function (resolve, reject) {
      var wanted;
      var each = (name === 'find') ? 'each': 'eachSeries';
      
      // TODO: make the eachSeries stop after value passes fn test
      
      underpromise[each](function (promise, idx) {
        var self = this;
        return args.fn(promise, idx).then(function (passed) {
          if (passed && !wanted) resolve(promise);
        }, reject);
      }, args.promises);
    });
  });
});


underpromise.compact = underpromise.filter(underpromise.boolean);

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

module.exports = underpromise;