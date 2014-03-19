var _ = require('../');
var test = require('tapes');
var Promise = require('promise');
var isPromise = require('is-promise');

test('creating promises', function (t) {
  t.plan(2);
  
  var promise1 = _.promise();
  t.ok(isPromise(promise1), 'creates promise');
  
  var promise2 = _.asPromise(123);
  promise2.then(function (val) {
    t.equal(val, 123, 'creates promise from a value');
  });
});

test('arrays', function (t) {
  test('each', function (t) {
    var iterator = 0;
    
    var promises = [
      Promise.from(123),
      Promise.from(456)
    ];
    
    _.each(promises, function (promise, resolve, reject, idx) {
      promise.then(function (val) {
        iterator += 1;
        t.equal(idx, iterator, 'passes in the index');
        resolve('this argument does nothing'); 
      });
    }).then(function () {
      t.equal(iterator, 2, 'loops through each promise');
      t.end();
    });
  });
  
  test('map', function (t) {
    var promises = [
      Promise.from(123),
      Promise.from(456)
    ];
    
    _.map(promises, function (promise, resolve, reject, idx) {
      promise.then(function (val) {
        resolve(val + 1);
      });
    }).then(function (res) {
      t.deepEqual(res, [124, 457], 'mapped array of promises');
      t.end();
    });
  });
  
  test('reduce', function (t) {
    var promises = [
      Promise.from(123),
      Promise.from(456),
      Promise.from(789)
    ];
    
    // Adds all the numbers in the promises together
    _.reduce(promises, function (prevPromise, currPromise, resolve, reject, idx) {
      Promise.all(prevPromise, currPromise).then(function (res) {
        resolve(res.reduce(function (memo, val) {
          return memo + val;
        }));
      });
    }).then(function (result) {
      t.equal(result, 1368, 'reuces array of promises');
      t.end();
    });
  });
  
  test('filter', function (t) {
    var promises = [
      Promise.from(123),
      Promise.from(456),
      Promise.from(789)
    ];
    
    _.filter(promises, function (promise, resolve, reject, idx) {
      promise.then(function (num) {
        resolve(num < 200);
      });
    }).then(function (res) {
      t.equal(res.length, 1, 'filtered promsies');
      t.equal(res[0], 123, 'promise value');
      t.end();
    });
  });
  
  test('find', function (t) {
    var promises = [
      Promise.from(123),
      Promise.from(456),
      Promise.from(789)
    ];
    
    _.find(promises, function (promise, resolve, reject, idx) {
      promise.then(function (num) {
        resolve(num < 200);
      });
    }).then(function (res) {
      t.equal(res, 123, 'found value');
      t.end();
    });
  });
  
  t.end();
});

test('collections', function (t) {
  test('pluck', function (t) {
    t.plan(2);
    
    var promise1 = new Promise(function (resolve, reject) {
      resolve({
        key1: 'promise1value1',
        key2: 'promise1value2'
      });
    });
    
    var promise2 = new Promise(function (resolve, reject) {
      resolve({
        key1: 'promise2value1',
        key2: 'promise2value2'
      });
    });
    
    _.pluck(promise1, 'key1').then(function (val) {
      t.deepEqual(val, ['promise1value1'], 'plucks a single value');
    });
    
    _.pluck([promise1, promise2], 'key1').then(function (val) {
      t.deepEqual(val, ['promise1value1', 'promise2value1'], 'plucks values from array');
    });
  });
  
  t.end();
});