var expect = require('expect.js');
var _ = require('../');
var clone = require('clone');
var Promise = require('promise');
var isPromise = require('is-promise');

describe('basic promising', function () {
  
  it('creates promises', function () {
    var promise1 = _.promise();
    var promise2 = _.promise(123);
    
    expect(isPromise(promise1)).to.equal(true);
    
    return promise2.then(function (val) {
      expect(val).to.equal(123);
    });
  });
  
  it('resolves when all promises resolve', function () {
    return _.all([_.promise(123), _.promise(456)]).then(function (values) {
      expect(values[0]).to.equal(123);
      expect(values[1]).to.equal(456);
    });
  });
  
  it('partially applies functions and arguments', function () {
    var activity = function (arg1, arg2) {
      expect(arg1).to.equal('arg1');
      expect(arg2).to.equal('arg2');
    };
    
    var doThis = _.partial(activity, 'arg1');
    
    return doThis('arg2');
  });
  
  // it('calls a method with an object of arguments', function () {
  //   var promise = _.promise(function (resolve) {
  //     resolve({
  //       key: 'value'
  //     });
  //   });
    
  //   return _.pluck({
  //     fn: 'key',
  //     promises: promise
  //   }).then(function (val) {
  //     expect(val).to.eql(['value']);
  //   });
  // });
  
  it('#identity()', function () {
    return _.identity(_.promise(123)).then(function (val) {
      expect(val).to.equal(123);
    });
  });
  
  it('#boolean()', function () {
    return _.boolean('string').then(function (bool) {
      expect(bool).to.eql(true);
    });
  });
  
  it('#inverseBoolean()', function () {
    return _.inverseBoolean('string').then(function (bool) {
      expect(bool).to.eql(false);
    });
  });
  
  it('turns non promise arguments into promises', function () {
    var partialMap = _.map(_.identity);
    var fullMap = _.map(_.identity, [4,5,6]);
    
    return _.all(partialMap([1,2,3]), fullMap).then(function (results) {
      expect(results[0]).to.eql([1,2,3]);
      expect(results[1]).to.eql([4,5,6]);
    });
  });
  
  it('chains multiple promises', function () {
    var promises = [
      _.promise(function (resolve) {
        resolve('a');
      }),
      _.promise('b'),
      _.promise('c')
    ];
    
    var dash = _.map(function (promise) {
      return _.promise(function (resolve, reject) {
        promise.then(function (letter) {
          resolve('-' + letter + '-');
        });
      });
    });
    
    var find = _.find(function (promise) {
      return _.promise(function (resolve, reject) {
        promise.then(function (letter) {
          resolve(letter === '-a-');
        });
      });
    });
    
    var yell = _.map(function (promise) {
      return _.promise(function (resolve, reject) {
        promise.then(function (letter) {
          resolve(letter + '!!!');
        });
      });
    });
    
    return dash(promises)
      .then(find)
      .then(yell)
      .then(function (result) {
        expect(result).to.eql(['-a-!!!']);
      });
  });
  
  it('composes multiple promise methods', function () {
    var prependZero = _.map(_.prepend('0'));
    var equals123 = _.find(_.equal('0123'));
    var yell = _.map(_.append('!'));
    var reverse = _.map(function (promise) {
      return promise.then(function (val) {
        return _.promise(val.split('').reverse().join(''));
      });
    });
    
    var yellify = _.compose(yell, reverse, equals123, prependZero);
    
    return yellify([
      _.promise(123),
      _.promise(456)
    ]).then(function (results) {
      expect(results[0]).to.equal('3210!');
    });
  });
  
});

describe('arrays', function () {
  
  it('#each()', function () {
    var iterator = 0;
    
    var promises = [
      _.promise(123),
      _.promise(456)
    ];
    
    var iterate = _.each(function (promise, resolve, reject, idx) {
      iterator += 1;
      return promise;
    });
    
    return iterate(promises).then(function (promise) {
      expect(iterator).to.equal(2);
    });
  });
  
  it('#each.series()', function () {
    var called123 = false;
    var called456 = false
    var promise123 = _.promise(function (resolve, reject) {
      setTimeout(function () {
        resolve(123);
      }, 0);
    });
    var promise456 = _.promise(456);
    
    return _.each.series(function (promise, idx) {
      return _.promise(function (resolve, reject) {
        promise.then(function (val) {
          if (val == 123) {
            called123 = true;
            expect(called456).to.equal(false);
          }
          
          if (val == 456) {
            called456 = true;
            expect(called123).to.equal(true);
          }
          
          resolve();
        });
      });
    }, [promise123, promise456]).then(function () {
      expect(called123).to.equal(true);
      expect(called456).to.equal(true);
    });
  });
  
  it('#map()', function () {
    var promises = [
      _.promise(123),
      _.promise(456)
    ];
    
    return _.map(_.add(1), promises).then(function (res) {
      expect(res).to.eql([124, 457]);
    });
  });
  
  it('#map.series()', function () {
    var called123 = false;
    var called456 = false;
    
    var promises = [
      _.promise(function (resolve) {
        setTimeout(function () {
          resolve(123);
        }, 0);
      }),
      _.promise(456)
    ];
    
    return _.map.series(function (promise) {
      return _.promise(function (resolve, reject) {
        promise.then(function (val) {
          if (val === 123) called123 = true;
          if (val === 456) called456 = true;
          
          if (val === 456) {
            expect(called123).to.equal(true);
          }
          
          resolve(val +1);
        });
      });
    }, promises).then(function (res) {
      expect(res).to.eql([124, 457]);
      expect(called123).to.equal(true);
      expect(called456).to.equal(true);
    });
  });
  
  it('#reduce()', function () {
    var promises = [
      _.promise('a'),
      _.promise('b'),
      _.promise('c')
    ];
    
    // Adds all the numbers in the promises together
    return _.reduce(function (prevPromise, currPromise) {
      return Promise.all(prevPromise, currPromise).then(function (res) {
        return _.promise(res.reduce(function (memo, val) {
          return memo + val;
        }));
      });
    }, promises).then(function (result) {
      expect(result).to.equal('abc');
    });
  });
  
  it('#reduceRight()', function () {
    var promises = [
      _.promise('a'),
      _.promise('b'),
      _.promise('c')
    ];
    
    // Adds all the numbers in the promises together
    return _.reduceRight(function (prevPromise, currPromise) {
      return Promise.all(prevPromise, currPromise).then(function (res) {
        return _.promise(res.reduce(function (memo, val) {
          return memo + val;
        }));
      });
    }, promises).then(function (result) {
      expect(result).to.equal('cba');
    });
  });
  
  it('#filter()', function () {
    var promises = [
      _.promise(123),
      _.promise(456),
      _.promise(789)
    ];
    
    return _.filter(function (promise, idx) {
      return _.promise(function (resolve) {
        promise.then(function (num) {
          resolve(num < 200);
        });
      });
    }, promises).then(function (res) {
      expect(res.length).to.equal(1);
      expect(res[0]).to.equal(123);
    });
  });
  
  it('#filter.series()', function () {
    var called123 = false;
    var called456 = false;
    var promises = [
      _.promise(function (resolve) {
        setTimeout(function () {
          resolve(123);
        }, 0);
      }),
      _.promise(456)
    ];
    
    return _.filter.series(function (promise, idx) {
      return promise.then(function (num) {
        if (num == 123) called123 = true;
        if (num == 456) called456 = true;
        if (num == 456) expect(called123).to.equal(true);
        
        return _.promise(num < 200);
      });
    }, promises).then(function (res) {
      expect(res.length).to.equal(1);
      expect(res[0]).to.equal(123);
      expect(called123).to.equal(true);
      expect(called456).to.equal(true);
    });
  });
  
  it('#reject(), opposite of filter', function () {
    var promises = [
      _.promise(123),
      _.promise(456),
      _.promise(789)
    ];
    
    return _.reject(_.lessThan(600), promises).then(function (res) {
      expect(res.length).to.equal(1);
      expect(res[0]).to.equal(789);
    });
  });
  
  it('#reject.series()', function () {
    var called123 = false;
    var called456 = false;
    var promises = [
      _.promise(function (resolve) {
        setTimeout(function () {
          resolve(123);
        }, 0);
      }),
      _.promise(456)
    ];
    
    return _.reject.series(function (promise, idx) {
      return promise.then(function (num) {
        if (num == 123) called123 = true;
        if (num == 456) called456 = true;
        if (num == 456) expect(called123).to.equal(true);
        
        return _.promise(num < 200);
      });
    }, promises).then(function (res) {
      expect(res.length).to.equal(1);
      expect(res[0]).to.equal(456);
      expect(called123).to.equal(true);
      expect(called456).to.equal(true);
    });
  });
  
  it('find', function () {
    var promises = [
      _.promise(function (resolve, reject) {
        setTimeout(function () {
          resolve(123);
        }, 0);
      }),
      _.promise(456),
      _.promise(789)
    ];
    
    // TODO: write this "and" method

    return _.find(function (promise) {
      return promise.then(function (num) {
        return _.promise(num > 200 && num < 500);
      });
    }, promises).then(function (res) {
      expect(res).to.equal(456);
    });
  });
  
  it('#find.series', function () {
    var called123 = false;
    var called456 = false;
    var promises = [
      _.promise(function (resolve, reject) {
        setTimeout(function () {
          resolve(123);
        }, 0);
      }),
      _.promise(456),
      _.promise(789)
    ];
    
    return _.find.series(function (promise) {
      return _.promise(function (resolve, reject) {
        promise.then(function (num) {
          if (num == 123) called123 = true;
          if (num == 456) called456 = true;
          if (num == 456) expect(called123).to.equal(true);
          
          resolve(num > 200 && num < 500);
        }, reject);
      });
    }, promises).then(function (res) {
      expect(res).to.equal(456);
      expect(called123).to.equal(true);
      expect(called456).to.equal(true);
    });
  });
  
  it('#max()', function () {
    return _.max([1,2,3]).then(function (max) {
      expect(max).to.equal(3);
    });
  });
  
  it('#min()', function () {
    return _.min([1,2,3]).then(function (max) {
      expect(max).to.equal(1);
    });
  });
  
  it('#sortBy()', function () {
    return _.sortBy(function (promise, idx) {
      return promise;
    }, [3,1,2]).then(function (sorted) {
      expect(sorted).to.eql([1,2,3]);
    })
  });
  
  it('#at()', function () {
    return _.at([0, 3], [9,8,7,6,5]).then(function (values) {
      expect(values).to.eql([9,6]);
    });
  });
  
  it('#compact(), remove all falsey values', function () {
    var promises = [
      _.promise(123),
      _.promise(false),
      _.promise(null),
      _.promise(456),
      _.promise(undefined)
    ];
    
    return _.compact(promises).then(function (values) {
      expect(values).to.eql([123, 456]);
    });
  }); 
  
  it('#first()', function () {
    var promises = [
      _.promise(123),
      _.promise(456)
    ];
    
    return _.first(promises).then(function (res) {
      expect(res).to.equal(123);
    });
  });
  
  it('#first.value(), gets the first value of a resolve promise', function () {
    return _.first.value(_.promise([1,2,3])).then(function (res) {
      expect(res).to.equal(1);
    });
  });
  
  it('#last()', function () {
    var promises = [
      _.promise(123),
      _.promise(456),
      _.promise(789)
    ];
    
    return _.last(promises).then(function (res) {
      expect(res).to.equal(789);
    });
  });
  
  it('#last.value(), gets the last value of a resolve promise', function () {
    return _.last.value(_.promise([1,2,3])).then(function (res) {
      expect(res).to.equal(3);
    });
  });
  
  it('#initial(), everything but the last', function () {
    var promises = [
      _.promise(123),
      _.promise(456),
      _.promise(789)
    ];
    
    return _.initial(promises).then(function (res) {
      expect(res).to.eql([123,456]);
    });
  });
  
  it('#initial.values(), all but the last values of a resolved promise', function () {
    return _.initial.values(_.promise([1,2,3])).then(function (res) {
      expect(res).to.eql([1,2]);
    });
  });
  
  it('#tail(), everything but the first', function () {
    var promises = [
      _.promise(123),
      _.promise(456),
      _.promise(789)
    ];
    
    return _.tail(promises).then(function (res) {
      expect(res).to.eql([456,789]);
    });
  });
  
  it('#tail.values()', function () {
    return _.tail.values(_.promise([1,2,3])).then(function (res) {
      expect(res).to.eql([2, 3]);
    });
  });
  
  it('#reverse()', function () {
    var promises = [
      _.promise(123),
      _.promise(456),
      _.promise(789)
    ];
    
    return _.reverse(promises).then(function (res) {
      expect(res).to.eql([789,456,123]);
    });
  });
  
  it('#reverse.values()', function () {
    return _.reverse.values(_.promise([1,2,3])).then(function (arr) {
      expect(arr).to.eql([3,2,1]);
    });
  });
  
});

describe('collections', function () {
  
  it('#where()', function () {
    var promises = [
      _.promise({id:1, name: 'node'}),
      _.promise({id:2, name: 'javascript'})
    ];
    
    return _.where({id: 1}, promises).then(function (res) {
      expect(res.length).to.equal(1);
      expect(res[0].id).to.equal(1);
    });
  });
  
  it('#findWhere()', function () {
    var promises = [
      _.promise({id:1, name: 'node'}),
      _.promise({id:2, name: 'javascript'})
    ];
    
    return _.findWhere({id: 2}, promises).then(function (res) {
      expect(res).to.eql({id: 2, name: 'javascript'});
    });
  });
  
  it('#pluck()', function () {
    var promise1 = _.promise(function (resolve, reject) {
      resolve({
        key1: 'promise1value1',
        key2: 'promise1value2'
      });
    });
    
    var promise2 = _.promise(function (resolve, reject) {
      resolve({
        key1: 'promise2value1',
        key2: 'promise2value2'
      });
    });
    
    return _.pluck('key1', [promise1, promise2]).then(function (val) {
      expect(val).to.eql(['promise1value1', 'promise2value1']);
    });
  });
  
  it('#every()', function () {
    var promises = [
      _.promise(true),
      _.promise(false)
    ];
    
    return _.every(promises).then(function (every) {
      expect(every).to.equal(false);
    });
  });
  
  it('#some()', function () {
    var promises = [
      _.promise(false),
      _.promise(false)
    ];
    
    return _.some(promises).then(function (every) {
      expect(every).to.equal(false);
    });
  });
  
  // TODO: make contains take an array of values
  it('#contains()', function () {
    var promises = [
      _.promise('abc'),
      _.promise('def')
    ];
    
    return _.contains('abc', promises).then(function (contains) {
      expect(contains).to.equal(true);
    });
  });
  
});

describe('objects', function () {
  
  it('#keys()', function () {
    var obj = {
      key1: 'value',
      key2: 'value'
    };
    
    var promise = _.promise(obj);
    
    return _.keys(promise).then(function (keys) {
      expect(keys).to.eql(Object.keys(obj));
    });
  });
  
  it('#values()', function () {
    var promise = _.promise({
      key1: 'value1',
      key2: 'value2'
    });
    
    return _.values(promise).then(function (values) {
      expect(values).to.eql(['value1', 'value2']);
    });
  });
  
  it('#extend()', function () {
    var promiseExtension = _.promise({key1: 'value3'});
    var obj = {
      key1: 'value1',
      key2: 'value2'
    };
    
    return _.extend(_.promise(obj), {key2: 'extended2'}, promiseExtension).then(function (obj) {
      expect(obj).to.eql({
        key1: 'value3',
        key2: 'extended2'
      });
    });
  });
  
  it('#defaults()', function () {
    var obj = {
      key1: 'value1',
      key2: 'noop2'
    };
    
    var valuesPromise = _.promise(obj);
    var defaults = _.promise({
      key1: 'value3',
      key2: 'noop'
    });
    
    return _.defaults(defaults, valuesPromise).then(function (obj) {
      expect(obj).to.eql({
        key1: 'value1',
        key2: 'noop2'
      });
    });
  });
  
  it('#pick(), get object with only the specified properties', function () {
    var promise = _.promise({
      key1: 'value1',
      key2: 'value2',
      key3: 'value3'
    });
    
    return _.pick(['key1', 'key3'], promise).then(function (res) {
      expect(res).to.eql({key1: 'value1', key3: 'value3'});
    });
  });
  
  it('#omit(), get object without the specified keys', function () {
    var promise = _.promise({
      key1: 'value1',
      key2: 'value2',
      key3: 'value3'
    });
    
    return _.omit(['key1', 'key2'], promise).then(function (res) {
      expect(res).to.eql({key3: 'value3'});
    });
  });
  
  it('#zipObject()', function () {
    var promise1 = _.promise(['name', 'age']);
    var promise2 = _.promise(['_', '30']);
    
    return _.zipObject(promise1, promise2).then(function (obj) {
      expect(obj).to.eql({
        name: '_',
        age: '30'
      });
    });
  });
  
});

describe('strings', function () {
  
  it('#prepend()', function () {
    return _.prepend('short_', _.promise('string')).then(function (str) {
      expect(str).to.equal('short_string');
    });
  });
  
  it('#append()', function () {
    var pluralize = _.append('s');
    
    return pluralize(_.promise('string')).then(function (str) {
      expect(str).to.equal('strings');
    });
  });
  
});

describe('utilities', function () {
  
  it('#equal()', function () {
    return _.equal(_.promise(1), _.promise(2)).then(function (isEqual) {
      expect(isEqual).to.equal(false);
    });
  });
  
  it('#greaterThan()', function () {
    return _.greaterThan(_.promise(100), _.promise(123)).then(function (isGreater) {
      expect(isGreater).to.equal(true);
    });
  });
  
  it('#lessThan()', function () {
    return _.lessThan(200, _.promise(123)).then(function (isGreater) {
      expect(isGreater).to.equal(true);
    });
  });
  
  it('#add()', function () {
    return _.add(_.promise(1), _.promise(123)).then(function (val) {
      expect(val).to.equal(124);
    });
  });
  
  it('#subtract()', function () {
    return _.subtract(_.promise(1), _.promise(123)).then(function (val) {
      expect(val).to.equal(122);
    });
  });
  
});