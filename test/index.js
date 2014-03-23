var expect = require('expect.js');
var _ = require('../');
var clone = require('clone');
var Promise = require('promise');
var isPromise = require('is-promise');

/*

TODO
==============
- angular support
- move to seprate folders/modules

 */
 

describe('basic promising', function () {
  
  it('creates promises', function (done) {
    var promise1 = _.promise();
    expect(isPromise(promise1)).to.equal(true);
    
    var promise2 = _.asPromise(123);
    promise2.then(function (val) {
      expect(val).to.equal(123);
      done();
    }, done).done();
  });
  
  it('resolves when all promises resolve', function (done) {
    _.all([_.asPromise(123), _.asPromise(456)]).then(function (values) {
      expect(values[0]).to.equal(123);
      expect(values[1]).to.equal(456);
      done();
    }).done();
  });
  
  it('partially applies functions and arguments', function (done) {
    var activity = function (arg1, arg2) {
      expect(arg1).to.equal('arg1');
      expect(arg2).to.equal('arg2');
      done();
    };
    
    var doThis = _.partial(activity, 'arg1');
    doThis('arg2');
  });
  
  it('calls a method with an object of arguments', function (done) {
    var promise = _.promise(function (resolve) {
      resolve({
        key: 'value'
      });
    });
    
    _.pluck({
      fn: 'key',
      promises: promise
    }).then(function (val) {
      expect(val).to.eql(['value']);
      done();
    }, done).done();
  });
  
  
  it('customizes the order of each method argument passed to the method', function (done) {
    _.promiseFirst();
    
    var promise = _.promise(function (resolve) {
      resolve({
        key: 'value'
      });
    });
    
    _.pluck(promise, 'key').then(function (val) {
      expect(val).to.eql(['value']);
    }, done).done(function () {
      _.functionFirst();
      done();
    });
  });
  
  it('#identity()', function (done) {
    var arg = _.identity(_.asPromise(123));
    arg.then(function (val) {
      expect(val).to.equal(123);
      done();
    });
  });
  
  it('#boolean()', function () {
    _.boolean('string').then(function (val) {
      expect(bool).to.strictEqal(true);
      done();
    });
  });
  
  it('#inverseBoolean()', function () {
    _.inverseBoolean('string').then(function (val) {
      expect(bool).to.strictEqal(false);
      done();
    });
  });
  
  it('turns non promise arguments into promises', function (done) {
    var partialMap = _.map(_.identity);
    var fullMap = _.map(_.identity, [4,5,6]);
    
    _.all(partialMap([1,2,3]), fullMap).then(function (results) {
      expect(results[0]).to.eql([1,2,3]);
      expect(results[1]).to.eql([4,5,6]);
      done();
    }).done();
  });
  
  it('chains multiple promises', function (done) {
    var promises = [
      _.promise(function (resolve) {
        resolve('a');
      }),
      _.asPromise('b'),
      _.asPromise('c')
    ];
    
    var dash = _.map(function (promise) {
      return _.promise(function (resolve, reject) {
        promise.then(function (letter) {
          resolve('-' + letter + '-');
        }, reject);
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
    
    dash(promises)
      .then(find)
      .then(yell)
      .then(function (result) {
        expect(result).to.eql(['-a-!!!']);
        done();
      }).done();
  });
  
  it('composes multiple promise methods', function (done) {
    var prependZero = _.map(_.prepend('0'));
    var equals123 = _.find(_.equal('0123'));
    var yell = _.map(_.append('!'));
    var reverse = _.map(function (promise) {
      return promise.then(function (val) {
        return _.asPromise(val.split('').reverse().join(''));
      });
    });
    
    var yellify = _.compose(yell, reverse, equals123, prependZero);
    
    yellify([
      _.asPromise(123),
      _.asPromise(456)
    ]).then(function (results) {
      expect(results[0]).to.equal('3210!');
      done();
    }).done();
  });
  
});

describe('arrays', function () {
  
  it('#each()', function (done) {
    var iterator = 0;
    
    var promises = [
      _.asPromise(123),
      _.asPromise(456)
    ];
    
    var iterate = _.each(function (promise, resolve, reject, idx) {
      iterator += 1;
      return promise;
    });
    
    iterate(promises).then(function () {
      expect(iterator).to.equal(2);
      done();
    }).done();
  });
  
  it('#eachSeries()', function (done) {
    var called123 = false;
    var called456 = false
    var promise123 = _.promise(function (resolve, reject) {
      setTimeout(function () {
        resolve(123);
      }, 0);
    });
    var promise456 = _.asPromise(456);
    
    _.eachSeries(function (promise, idx) {
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
        }).done();
      });
    }, [promise123, promise456]).then(function () {
      expect(called123).to.equal(true);
      expect(called456).to.equal(true);
      done();
    }).done();
  });
  
  it('#map()', function (done) {
    var promises = [
      _.asPromise(123),
      _.asPromise(456)
    ];
    
    _.map(_.add(1), promises).then(function (res) {
      expect(res).to.eql([124, 457]);
      done();
    }).done();
  });
  
  it('#mapSeries', function (done) {
    var called123 = false;
    var called456 = false;
    
    var promises = [
      _.promise(function (resolve) {
        setTimeout(function () {
          resolve(123);
        }, 0);
      }),
      _.asPromise(456)
    ];
    
    _.mapSeries(function (promise) {
      return _.promise(function (resolve, reject) {
        promise.then(function (val) {
          if (val === 123) called123 = true;
          if (val === 456) called456 = true;
          
          if (val === 456) {
            expect(called123).to.equal(true);
          }
          
          resolve(val +1);
        });
      }, done);
    }, promises).then(function (res) {
      expect(res).to.eql([124, 457]);
      expect(called123).to.equal(true);
      expect(called456).to.equal(true);
      done();
    }).done();
  });
  
  it('#reduce()', function (done) {
    var promises = [
      _.asPromise('a'),
      _.asPromise('b'),
      _.asPromise('c')
    ];
    
    // Adds all the numbers in the promises together
    _.reduce(function (prevPromise, currPromise) {
      return Promise.all(prevPromise, currPromise).then(function (res) {
        return _.asPromise(res.reduce(function (memo, val) {
          return memo + val;
        }));
      });
    }, promises).then(function (result) {
      expect(result).to.equal('abc');
      done();
    }).done();
  });
  
  it('#reduceRight()', function (done) {
    var promises = [
      _.asPromise('a'),
      _.asPromise('b'),
      _.asPromise('c')
    ];
    
    // Adds all the numbers in the promises together
    _.reduceRight(function (prevPromise, currPromise) {
      return Promise.all(prevPromise, currPromise).then(function (res) {
        return _.asPromise(res.reduce(function (memo, val) {
          return memo + val;
        }));
      });
    }, promises).then(function (result) {
      expect(result).to.equal('cba');
      done();
    }).done();
  });
  
  it('#filter()', function (done) {
    var promises = [
      _.asPromise(123),
      _.asPromise(456),
      _.asPromise(789)
    ];
    
    _.filter(function (promise, idx) {
      return _.promise(function (resolve) {
        promise.then(function (num) {
          resolve(num < 200);
        });
      });
    }, promises).then(function (res) {
      expect(res.length).to.equal(1);
      expect(res[0]).to.equal(123);
      done();
    }).done();
  });
  
  it('#filterSeries()', function (done) {
    var called123 = false;
    var called456 = false;
    var promises = [
      _.promise(function (resolve) {
        setTimeout(function () {
          resolve(123);
        }, 0);
      }),
      _.asPromise(456)
    ];
    
    _.filterSeries(function (promise, idx) {
      return promise.then(function (num) {
        if (num == 123) called123 = true;
        if (num == 456) called456 = true;
        if (num == 456) expect(called123).to.equal(true);
        
        return _.asPromise(num < 200);
      });
    }, promises).then(function (res) {
      expect(res.length).to.equal(1);
      expect(res[0]).to.equal(123);
      expect(called123).to.equal(true);
      expect(called456).to.equal(true);
      done();
    }).done();
  });
  
  it('#reject(), opposite of filter', function (done) {
    var promises = [
      _.asPromise(123),
      _.asPromise(456),
      _.asPromise(789)
    ];
    
    _.reject(_.lessThan(600), promises).then(function (res) {
      expect(res.length).to.equal(1);
      expect(res[0]).to.equal(789);
      
      done();
    }).done();
  });
  
  it('#rejectSeries()', function (done) {
    var called123 = false;
    var called456 = false;
    var promises = [
      _.promise(function (resolve) {
        setTimeout(function () {
          resolve(123);
        }, 0);
      }),
      _.asPromise(456)
    ];
    
    _.rejectSeries(function (promise, idx) {
      return promise.then(function (num) {
        if (num == 123) called123 = true;
        if (num == 456) called456 = true;
        if (num == 456) expect(called123).to.equal(true);
        
        return _.asPromise(num < 200);
      });
    }, promises).then(function (res) {
      expect(res.length).to.equal(1);
      expect(res[0]).to.equal(456);
      expect(called123).to.equal(true);
      expect(called456).to.equal(true);
      done();
    }).done();
  });
  
  it('find', function (done) {
    var promises = [
      _.promise(function (resolve, reject) {
        setTimeout(function () {
          resolve(123);
        }, 0);
      }),
      _.asPromise(456),
      _.asPromise(789)
    ];
    
    // TODO: write this "and" method

    _.find(function (promise) {
      return promise.then(function (num) {
        return _.asPromise(num > 200 && num < 500);
      });
    }, promises).then(function (res) {
      expect(res).to.equal(456);
      done();
    }).done();
  });
  
  it('#findSeries', function (done) {
    var called123 = false;
    var called456 = false;
    var promises = [
      _.promise(function (resolve, reject) {
        setTimeout(function () {
          resolve(123);
        }, 0);
      }),
      _.asPromise(456),
      _.asPromise(789)
    ];
    
    _.findSeries(function (promise) {
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
      done();
    }).done();
  });
  
  it('#compact(), remove all falsey values', function (done) {
    var promises = [
      _.asPromise(123),
      _.asPromise(false),
      _.asPromise(null),
      _.asPromise(456),
      _.asPromise(undefined)
    ];
    
    _.compact(promises).then(function (values) {
      expect(values).to.eql([123, 456]);
      done();
    }).done();
  }); 
  
  it('#first()', function (done) {
    var promises = [
      _.asPromise(123),
      _.asPromise(456)
    ];
    
    _.first(promises).then(function (res) {
      expect(res).to.equal(123);
      done();
    }).done();
  });
  
  it('#firstValue(), gets the first value of a resolve promise', function (done) {
    _.firstValue(_.asPromise([1,2,3])).then(function (res) {
      expect(res).to.equal(1);
      done();
    }).done();
  });
  
  it('#last()', function (done) {
    var promises = [
      _.asPromise(123),
      _.asPromise(456),
      _.asPromise(789)
    ];
    
    _.last(promises).then(function (res) {
      expect(res).to.equal(789);
      done();
    }).done();
  });
  
  it('#lastValue(), gets the last value of a resolve promise', function (done) {
    _.lastValue(_.asPromise([1,2,3])).then(function (res) {
      expect(res).to.equal(3);
      done();
    }).done();
  });
  
  it('#initial(), everything but the last', function (done) {
    var promises = [
      _.asPromise(123),
      _.asPromise(456),
      _.asPromise(789)
    ];
    
    _.initial(promises).then(function (res) {
      expect(res).to.eql([123,456]);
      done();
    }).done();
  });
  
  it('#initialValues(), all but the last values of a resolved promise', function (done) {
    _.initialValues(_.asPromise([1,2,3])).then(function (res) {
      expect(res).to.eql([1,2]);
      done();
    }).done();
  });
  
  it('#tail(), everything but the first', function (done) {
    var promises = [
      _.asPromise(123),
      _.asPromise(456),
      _.asPromise(789)
    ];
    
    _.tail(promises).then(function (res) {
      expect(res).to.eql([456,789]);
      done();
    }).done();
  });
  
  it('#tailValues()', function (done) {
    _.tailValues(_.asPromise([1,2,3])).then(function (res) {
      expect(res).to.eql([2, 3]);
      done();
    }).done();
  });
  
  it('#reverse()', function (done) {
    var promises = [
      _.asPromise(123),
      _.asPromise(456),
      _.asPromise(789)
    ];
    
    _.reverse(promises).then(function (res) {
      expect(res).to.eql([789,456,123]);
      done();
    }).done();
  });
  
  it('#reverseValues()', function (done) {
    _.reverseValues(_.asPromise([1,2,3])).then(function (arr) {
      expect(arr).to.eql([3,2,1]);
      done();
    }).done();
  });
  
});

describe('collections', function () {
  
  it('#where()', function (done) {
    var promises = [
      _.asPromise({id:1, name: 'node'}),
      _.asPromise({id:2, name: 'javascript'})
    ];
    
    _.where({id: 1}, promises).then(function (res) {
      expect(res.length).to.equal(1);
      expect(res[0].id).to.equal(1);
      done();
    }).done();
  });
  
  it('#findWhere()', function (done) {
    var promises = [
      _.asPromise({id:1, name: 'node'}),
      _.asPromise({id:2, name: 'javascript'})
    ];
    
    _.findWhere({id: 2}, promises).then(function (res) {
      expect(res).to.eql({id: 2, name: 'javascript'});
      done();
    }).done();
  });
  
  it('#pluck()', function (done) {
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
    
    _.pluck('key1', [promise1, promise2]).then(function (val) {
      expect(val).to.eql(['promise1value1', 'promise2value1']);
      done();
    }).done();
  });
  
  it('#every()', function (done) {
    var promises = [
      _.asPromise(true),
      _.asPromise(false)
    ];
    
    _.every(promises).then(function (every) {
      expect(every).to.equal(false);
      done();
    }).done();
  });
  
  it('#some()', function (done) {
    var promises = [
      _.asPromise(false),
      _.asPromise(false)
    ];
    
    _.some(promises).then(function (every) {
      expect(every).to.equal(false);
      done();
    }).done();
  });
  
  // TODO: make contains take an array of values
  it('#contains()', function (done) {
    var promises = [
      _.asPromise('abc'),
      _.asPromise('def')
    ];
    
    _.contains('abc', promises).then(function (contains) {
      expect(contains).to.equal(true);
      done();
    }).done();
  });
  
  // TODO: make these
  
  it('#max()');
  it('#min()');
  it('#sortBy()');
  it('#indexBy()');
  it('#countBy()');
  it('#at()');
  
});

describe('objects', function () {
  
  it('#keys()', function (done) {
    var obj = {
      key1: 'value',
      key2: 'value'
    };
    
    var promise = _.asPromise(obj);
    
    _.keys(promise).then(function (keys) {
      expect(keys).to.eql(Object.keys(obj));
      done();
    }).done();
  });
  
  it('#values()', function (done) {
    var promise = _.asPromise({
      key1: 'value1',
      key2: 'value2'
    });
    
    _.values(promise).then(function (values) {
      expect(values).to.eql(['value1', 'value2']);
      done();
    }).done();
  });
  
  it('#extend()', function (done) {
    var obj = {
      key1: 'value1',
      key2: 'value2'
    };
    var promiseExtension = _.asPromise({
      key1: 'value3'
    });
    var extend = _.extend(_.asPromise(obj)); // OOOHHH partial-like
    
    extend(promiseExtension).then(function (obj) {
      expect(obj).to.eql({
        key1: 'value3',
        key2: 'value2'
      });
      done();
    }).done();
  });
  
  it('#defaults()', function (done) {
    var obj = {
      key1: 'value1',
      key2: 'noop2'
    };
    
    var valuesPromise = _.asPromise(obj);
    var defaults = _.asPromise({
      key1: 'value3',
      key2: 'noop'
    });
    
    _.defaults(defaults, valuesPromise).then(function (obj) {
      expect(obj).to.eql({
        key1: 'value1',
        key2: 'noop2'
      });
      done();
    }).done();
  });
  
  it('#pick(), get object with only the specified properties', function (done) {
    var promise = _.asPromise({
      key1: 'value1',
      key2: 'value2',
      key3: 'value3'
    });
    
    _.pick('key1', 'key3', promise).then(function (res) {
      expect(res).to.eql({key1: 'value1', key3: 'value3'});
      done();
    }).done();
  });
  
  it('#omit(), get object without the specified keys', function (done) {
    var promise = _.asPromise({
      key1: 'value1',
      key2: 'value2',
      key3: 'value3'
    });
    
    _.omit('key1', 'key2', promise).then(function (res) {
      expect(res).to.eql({key3: 'value3'});
      done();
    }).done();
  });
  
  it('#zipObject()', function (done) {
    var promise1 = _.asPromise(['name', 'age']);
    var promise2 = _.asPromise(['_', '30']);
    
    _.zipObject(promise1, promise2).then(function (obj) {
      expect(obj).to.eql({
        name: '_',
        age: '30'
      });
      done();
    });
  });
  
});

describe('strings', function () {
  
  it('#prepend()', function (done) {
    _.prepend('short_', _.asPromise('string')).then(function (str) {
      expect(str).to.equal('short_string');
      done();
    }).done();
  });
  
  it('#append()', function (done) {
    _.append('s', _.asPromise('string')).then(function (str) {
      expect(str).to.equal('strings');
      done();
    }).done();
  });
  
});

describe('utilities', function () {
  
  it('#equal()', function (done) {
    _.equal(_.asPromise(1), _.asPromise(2)).then(function (isEqual) {
      expect(isEqual).to.equal(false);
      done();
    }).done();
  });
  
  it('#greaterThan()', function (done) {
    _.greaterThan(_.asPromise(100), _.asPromise(123)).then(function (isGreater) {
      expect(isGreater).to.equal(true);
      done();
    }).done();
  });
  
  it('#lessThan()', function (done) {
    _.lessThan(200, _.asPromise(123)).then(function (isGreater) {
      expect(isGreater).to.equal(true);
      done();
    });
  });
  
  it('#add()', function (done) {
    _.add(_.asPromise(1), _.asPromise(123)).then(function (val) {
      expect(val).to.equal(124);
      done();
    }).done();
  });
  
  it('#subtract()', function (done) {
    _.subtract(_.asPromise(1), _.asPromise(123)).then(function (val) {
      expect(val).to.equal(122);
      done();
    }).done();
  });
  
});