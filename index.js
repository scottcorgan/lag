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

underpromise.compose = function (yell, find, map) {
  var fns = asArray(arguments).reverse();
  
  return function (promises) {
    return underpromise.promise(function (resolve, reject) {
      nextFn(promises)

      function nextFn (promises) {
        var fn = fns.shift();
        
        if (!fn) resolve(underpromise.asPromise(promises));
        
        return underpromise.promise(function (resolve, reject) {
          fn(promises).then(function (res) {
            nextFn(res);
          }, reject);
        });
      }
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
  var idx = 0;
  var queue = asArray(args.promises).map(function (promise) {
    return function () {
      var _args = callbacker(arguments);
      idx += 1;
      
      underpromise.promise(function (resolve, reject) {
        args.fn(promise, resolve, reject, idx, function (err) {
          // Exit
          // TODO: make this exit the loop here
          resolve();
        });
      }).then(function (value) {
        _args.callback.apply(null, null, value);
      }, _args.callback);
    };
  });
  
  var drain = drainer(queue);
  
  return underpromise.promise(function (resolve, reject) {
    drain(function (err) {
      if (err) return reject(err);
      return resolve();
    });
  });
});

underpromise._method('map', function (args) {
  return underpromise.promise(function (resolve, reject) {
    var mapped = [];
    
    underpromise.each(function (promise, resolve, reject, idx) {
      args.fn(promise, function (value) {
        mapped.push(value);
        resolve();
      }, reject, idx);
    }, args.promises).then(function () {
      resolve(mapped);
    }, reject);
  });
});

underpromise._method('reduce', function (args) {
  return underpromise.promise(function (resolve, reject) {
    var accum = args.promises.shift();
    
    underpromise.each(function (promise, resolve, reject, idx) {
      args.fn(accum, promise, function (val) {
        accum = underpromise.asPromise(val);
        resolve();
      }, reject, idx);
    }, args.promises).then(function () {
      resolve(accum);
    }, reject);
  });
});

underpromise._method('reduceRight', function (args) {
  return underpromise.reduce({
    fn: args.fn,
    promises: args.promises.reverse()
  });
});

underpromise._method('filter', function (args) {
  return underpromise.promise(function (resolve, reject) {
    var filtered = [];
    
    underpromise.each(function (promise, resolve, reject, idx) {
      args.fn(promise, function (passed) {
        if (passed) filtered.push(promise);
        resolve();
      }, reject, idx);
    }, args.promises).then(function () {
      resolve(Promise.all(filtered));
    }, reject);
  });
});

underpromise._method('find', function (args) {
  return underpromise.promise(function (resolve, reject) {
    var wantedPromise;
    
    underpromise.each(function (promise, _resolve, reject, idx, _exit) {
      args.fn(promise, function (passed) {
        if (passed) {
          wantedPromise = promise;
          _exit();
        }
        else{
          _resolve();
        }
      }, reject, idx);
    }, args.promises).then(function () {
      resolve(wantedPromise);
    }, reject);
  });
});

// Collections

underpromise._method('pluck', function (args) {
  return underpromise.promise(function (resolve, reject) {
    Promise.all(args.promises).then(function (res) {
      resolve(res.map(function (obj) {
        return obj[args.fn];
      }));
    }, reject);
  });
});

module.exports = underpromise;