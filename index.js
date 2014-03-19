var Promise = require('promise');
var isPromise = require('is-promise');
var asArray = require('as-array');
var drainer = require('drainer');
var callbacker = require('callbacker');

var underpromise = {};

underpromise._method = function (name, fn) {
  return this[name] = this._partialize(fn);
};

underpromise.promise = function (fn) {
  fn = fn || function () {};
  return new Promise(fn);
};

underpromise.asPromise = function (value) {
  return Promise.from(value);
};

underpromise.partial = function () {
  var partialArgs = asArray(arguments);
  var fn = partialArgs.shift();
  
  return function () {
    var appliedArgs = asArray(arguments);
    return fn.apply(fn, partialArgs.concat(appliedArgs));
  };
};

underpromise._partialize = function (callback) {
  return function (fn, promises) {
    fn = fn || function (promise, resolve) {resolve();};
    if (!promises) return underpromise.partial(callback, fn);
    return callback(fn, promises);
  };
};

// Arrays

underpromise._method('each', function (fn, promises) {
  var idx = 0;
  var queue = asArray(promises).map(function (promise) {
    return function () {
      var args = callbacker(arguments);
      idx += 1;
      
      underpromise.promise(function (resolve, reject) {
        fn(promise, resolve, reject, idx, function (err) {
          // Exit
          // TODO: make this exit the loop here
          resolve();
        });
      }).then(function (value) {
        args.callback.apply(null, null, value);
      }, args.callback);
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

underpromise._method('map', function (fn, promises) {
  return underpromise.promise(function (resolve, reject) {
    var mapped = [];
    
    underpromise.each(function (promise, resolve, reject, idx) {
      fn(promise, function (value) {
        mapped.push(value);
        resolve();
      }, reject, idx);
    }, promises).then(function () {
      resolve(mapped);
    }, reject);
  });
});

underpromise._method('reduce', function (fn, promises) {
  return underpromise.promise(function (resolve, reject) {
    var accum = promises.shift();
    
    underpromise.each(function (promise, resolve, reject, idx) {
      fn(accum, promise, function (val) {
        accum = Promise.from(val);
        resolve();
      }, reject, idx);
    }, promises).then(function () {
      resolve(accum);
    }, reject);
  });
});

underpromise._method('reduceRight', function (fn, promises) {
  return underpromise.reduce(fn, promises.reverse());
});

underpromise._method('filter', function (fn, promises) {
  return underpromise.promise(function (resolve, reject) {
    var filtered = [];
    
    underpromise.each(function (promise, resolve, reject, idx) {
      fn(promise, function (passed) {
        if (passed) filtered.push(promise);
        resolve();
      }, reject, idx);
    }, promises).then(function () {
      resolve(Promise.all(filtered));
    }, reject);
  });
});

underpromise._method('find', function (fn, promises) {
  return underpromise.promise(function (resolve, reject) {
    var wantedPromise;
    
    underpromise.each(function (promise, _resolve, reject, idx, _exit) {
      fn(promise, function (passed) {
        if (passed) {
          wantedPromise = promise;
          _exit();
        }
        else{
          _resolve();
        }
      }, reject, idx);
    }, promises).then(function () {
      resolve(wantedPromise);
    }, reject);
  });
});

// Collections

underpromise._method('pluck', function (key, promise) {
  return underpromise.promise(function (resolve, reject) {
    Promise.all(promise).then(function (res) {
      resolve(res.map(function (obj) {
        return obj[key];
      }));
    }, reject);
  });
});

module.exports = underpromise;