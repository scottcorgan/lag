var Promise = require('promise');
var isPromise = require('is-promise');
var asArray = require('as-array');
var drainer = require('drainer');
var callbacker = require('callbacker');

var _ = {};

_.promise = function (fn) {
  fn = fn || function () {};
  return new Promise(fn);
};

_.asPromise = function (value) {
  return Promise.from(value);
};

// Arrays

_.each = function (promises, fn) {
  var idx = 0;
  var queue = asArray(promises).map(function (promise) {
    return function () {
      var args = callbacker(arguments);
      idx += 1;
      
      _.promise(function (resolve, reject) {
        fn(promise, resolve, reject, idx);
      }).then(function (value) {
        args.callback.apply(null, null, value);
      }, args.callback);
    };
  });
  
  var drain = drainer(queue);
  
  return _.promise(function (resolve, reject) {
    drain(function (err) {
      if (err) return reject(err);
      return resolve();
    });
  });
};

_.map = function (promises, fn) {
  return _.promise(function (resolve, reject) {
    var mapped = [];
    
    _.each(promises, function (promise, resolve, reject, idx) {
      fn(promise, function (value) {
        mapped.push(Promise.from(value));
        resolve();
      }, reject, idx);
    }).then(function () {
      resolve(mapped);
    }, reject);
  });
};

// Collections

_.pluck = function (promise, key) {
  return _.promise(function (resolve, reject) {
    Promise.all(promise).then(function (res) {
      resolve(res.map(function (obj) {
        return obj[key];
      }));
    }, reject);
  });
};

module.exports = _;