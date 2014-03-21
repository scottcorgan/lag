var expect = require('expect.js');
var sinon = require('sinon');
var lag = require('../');
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
    var promise1 = lag.promise();
    expect(isPromise(promise1)).to.equal(true);
    
    var promise2 = lag.asPromise(123);
    promise2.then(function (val) {
      expect(val).to.equal(123);
      done();
    }, done).done();
  });
  
  it('resolves when all promises resolve', function (done) {
    lag.all([lag.asPromise(123), lag.asPromise(456)]).then(function (values) {
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
    
    var doThis = lag.partial(activity, 'arg1');
    doThis('arg2');
  });
  
  it('calls a method with an object of arguments', function (done) {
    var promise = lag.promise(function (resolve) {
      resolve({
        key: 'value'
      });
    });
    
    lag.pluck({
      fn: 'key',
      promises: promise
    }).then(function (val) {
      expect(val).to.eql(['value']);
      done();
    }, done).done();
  });
  
  
  it('customizes the order of each method argument passed to the method', function (done) {
    lag.promiseFirst();
    
    var promise = lag.promise(function (resolve) {
      resolve({
        key: 'value'
      });
    });
    
    lag.pluck(promise, 'key').then(function (val) {
      expect(val).to.eql(['value']);
    }, done).done(function () {
      lag.functionFirst();
      done();
    });
  });
  
  it('#identity()', function (done) {
    var arg = lag.identity(lag.asPromise(123));
    arg.then(function (val) {
      expect(val).to.equal(123);
      done();
    });
  });
  
  it('#boolean()', function () {
    var bool = lag.boolean('string');
    
    bool.then(function (val) {
      expect(bool).to.strictEqal(true);
      done();
    });
  });
  
  it('#inverseBoolean()', function () {
    var bool = lag.inverseBoolean('string');
    
    bool.then(function (val) {
      expect(bool).to.strictEqal(false);
      done();
    });
  });
  
  it('turns non promise arguments into promises', function (done) {
    var partialMap = lag.map(lag.identity);
    var fullMap = lag.map(lag.identity, [4,5,6]);
    
    lag.all(partialMap([1,2,3]), fullMap).then(function (results) {
      expect(results[0]).to.eql([1,2,3]);
      expect(results[1]).to.eql([4,5,6]);
      done();
    }).done();
  });
  
  it('chains multiple promises', function (done) {
    var promises = [
      lag.promise(function (resolve) {
        resolve('a');
      }),
      lag.asPromise('b'),
      lag.asPromise('c')
    ];
    
    var dash = lag.map(function (promise) {
      return lag.promise(function (resolve, reject) {
        promise.then(function (letter) {
          resolve('-' + letter + '-');
        }, reject);
      });
    });
    
    var find = lag.find(function (promise) {
      return lag.promise(function (resolve, reject) {
        promise.then(function (letter) {
          resolve(letter === '-a-');
        });
      });
    });
    
    var yell = lag.map(function (promise) {
      return lag.promise(function (resolve, reject) {
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
    var map = lag.map(function (promise) {
      return lag.promise(function (resolve, reject) {
        promise.then(function (val) {
          resolve('0' + val);
        });
      });
    });
    var find = lag.find(function (promise) {
      return lag.promise(function (resolve, reject) {
        promise.then(function (val) {
          resolve(val === '0123');
        });
      });
    });
    var yell = lag.map(function (promise) {
      return lag.promise(function (resolve, reject) {
        promise.then(function (val) {
          resolve(val + '!');
        });
      });
    });
    var reverse = lag.map(function (promise) {
      return lag.promise(function (resolve, reject) {
        promise.then(function (val) {
          var arr = val.split('');
          resolve(arr.reverse().join(''));
        });
      });
    });
    var weird = lag.compose(yell, reverse, find, map);
    
    weird([
      lag.asPromise(123),
      lag.asPromise(456)
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
      lag.asPromise(123),
      lag.asPromise(456)
    ];
    
    var iterate = lag.each(function (promise, resolve, reject, idx) {
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
    var promise123 = lag.promise(function (resolve, reject) {
      setTimeout(function () {
        resolve(123);
      }, 0);
    });
    var promise456 = lag.asPromise(456);
    
    lag.eachSeries(function (promise, idx) {
      return lag.promise(function (resolve, reject) {
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
      lag.asPromise(123),
      lag.asPromise(456)
    ];
    
    lag.map(function (promise) {
      return lag.promise(function (resolve, reject) {
        promise.then(function (val) {
          resolve(val +1);
        });
      });
    }, promises).then(function (res) {
      expect(res).to.eql([124, 457]);
      done();
    }).done();
  });
  
  it('#mapSeries', function (done) {
    var called123 = false;
    var called456 = false;
    
    var promises = [
      lag.promise(function (resolve) {
        setTimeout(function () {
          resolve(123);
        }, 0);
      }),
      lag.asPromise(456)
    ];
    
    lag.mapSeries(function (promise) {
      return lag.promise(function (resolve, reject) {
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
      lag.asPromise('a'),
      lag.asPromise('b'),
      lag.asPromise('c')
    ];
    
    // Adds all the numbers in the promises together
    lag.reduce(function (prevPromise, currPromise) {
      return lag.promise(function (resolve) {
        Promise.all(prevPromise, currPromise).then(function (res) {
          resolve(res.reduce(function (memo, val) {
            return memo + val;
          }));
        });
      });
    }, promises).then(function (result) {
      expect(result).to.equal('abc');
      done();
    }).done();
  });
  
  it('#reduceRight()', function (done) {
    var promises = [
      lag.asPromise('a'),
      lag.asPromise('b'),
      lag.asPromise('c')
    ];
    
    // Adds all the numbers in the promises together
    lag.reduceRight(function (prevPromise, currPromise) {
      return lag.promise(function (resolve) {
        Promise.all(prevPromise, currPromise).then(function (res) {
          resolve(res.reduce(function (memo, val) {
            return memo + val;
          }));
        });
      });
    }, promises).then(function (result) {
      expect(result).to.equal('cba');
      done();
    }).done();
  });
  
  it('#filter()', function (done) {
    var promises = [
      lag.asPromise(123),
      lag.asPromise(456),
      lag.asPromise(789)
    ];
    
    lag.filter(function (promise, idx) {
      return lag.promise(function (resolve) {
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
      lag.promise(function (resolve) {
        setTimeout(function () {
          resolve(123);
        }, 0);
      }),
      lag.asPromise(456)
    ];
    
    lag.filterSeries(function (promise, idx) {
      return lag.promise(function (resolve) {
        promise.then(function (num) {
          if (num == 123) called123 = true;
          if (num == 456) called456 = true;
          if (num == 456) expect(called123).to.equal(true);
          
          resolve(num < 200);
        }).done();
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
      lag.asPromise(123),
      lag.asPromise(456),
      lag.asPromise(789)
    ];
    
    lag.reject(function (promise, idx) {
      return lag.promise(function (resolve) {
        promise.then(function (num) {
          resolve(num < 600);
        });
      });
    }, promises).then(function (res) {
      expect(res.length).to.equal(1);
      expect(res[0]).to.equal(789);
      done();
    }).done();
  });
  
  it('#rejectSeries()', function (done) {
    var called123 = false;
    var called456 = false;
    var promises = [
      lag.promise(function (resolve) {
        setTimeout(function () {
          resolve(123);
        }, 0);
      }),
      lag.asPromise(456)
    ];
    
    lag.rejectSeries(function (promise, idx) {
      return lag.promise(function (resolve) {
        promise.then(function (num) {
          if (num == 123) called123 = true;
          if (num == 456) called456 = true;
          if (num == 456) expect(called123).to.equal(true);
          
          resolve(num < 200);
        }).done();
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
      lag.promise(function (resolve, reject) {
        setTimeout(function () {
          resolve(123);
        }, 0);
      }),
      lag.asPromise(456),
      lag.asPromise(789)
    ];
    
    lag.find(function (promise) {
      return lag.promise(function (resolve, reject) {
        promise.then(function (num) {
          resolve(num > 200 && num < 500);
        }, reject);
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
      lag.promise(function (resolve, reject) {
        setTimeout(function () {
          resolve(123);
        }, 0);
      }),
      lag.asPromise(456),
      lag.asPromise(789)
    ];
    
    lag.findSeries(function (promise) {
      return lag.promise(function (resolve, reject) {
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
      lag.asPromise(123),
      lag.asPromise(false),
      lag.asPromise(null),
      lag.asPromise(456),
      lag.asPromise(undefined)
    ];
    
    lag.compact(promises).then(function (values) {
      expect(values).to.eql([123, 456]);
      done();
    }).done();
  }); 
  
  it('#first()', function (done) {
    var promises = [
      lag.asPromise(123),
      lag.asPromise(456)
    ];
    
    lag.first(promises).then(function (res) {
      expect(res).to.equal(123);
      done();
    }).done();
  });
  
  it('#initial(), everything but the last', function (done) {
    var promises = [
      lag.asPromise(123),
      lag.asPromise(456),
      lag.asPromise(789)
    ];
    
    lag.initial(promises).then(function (res) {
      expect(res).to.eql([123,456]);
      done();
    }).done();
  });
  
  it('#last()', function (done) {
    var promises = [
      lag.asPromise(123),
      lag.asPromise(456),
      lag.asPromise(789)
    ];
    
    lag.last(promises).then(function (res) {
      expect(res).to.equal(789);
      done();
    }).done();
  });
  
  it('#rest(), everything but the first', function (done) {
    var promises = [
      lag.asPromise(123),
      lag.asPromise(456),
      lag.asPromise(789)
    ];
    
    lag.rest(promises).then(function (res) {
      expect(res).to.eql([456,789]);
      done();
    }).done();
  });
  
});

describe('collections', function () {
  
  it('#where()', function (done) {
    var promises = [
      lag.asPromise({id:1, name: 'node'}),
      lag.asPromise({id:2, name: 'javascript'})
    ];
    
    lag.where({id: 1}, promises).then(function (res) {
      expect(res.length).to.equal(1);
      expect(res[0].id).to.equal(1);
      done();
    }).done();
  });
  
  it('#findWhere()', function (done) {
    var promises = [
      lag.asPromise({id:1, name: 'node'}),
      lag.asPromise({id:2, name: 'javascript'})
    ];
    
    lag.findWhere({id: 2}, promises).then(function (res) {
      expect(res).to.eql({id: 2, name: 'javascript'});
      done();
    }).done();
  });
  
  it('#pluck()', function (done) {
    var promise1 = lag.promise(function (resolve, reject) {
      resolve({
        key1: 'promise1value1',
        key2: 'promise1value2'
      });
    });
    
    var promise2 = lag.promise(function (resolve, reject) {
      resolve({
        key1: 'promise2value1',
        key2: 'promise2value2'
      });
    });
    
    lag.pluck('key1', [promise1, promise2]).then(function (val) {
      expect(val).to.eql(['promise1value1', 'promise2value1']);
      done();
    }).done();
  });
  
  it('#every()', function (done) {
    var promises = [
      lag.asPromise(true),
      lag.asPromise(false)
    ];
    
    lag.every(promises).then(function (every) {
      expect(every).to.equal(false);
      done();
    }).done();
  });
  
  it('#some()', function (done) {
    var promises = [
      lag.asPromise(false),
      lag.asPromise(false)
    ];
    
    lag.some(promises).then(function (every) {
      expect(every).to.equal(false);
      done();
    }).done();
  });
  
  // TODO: make contains take an array of values
  it('#contains()', function (done) {
    var promises = [
      lag.asPromise('abc'),
      lag.asPromise('def')
    ];
    
    lag.contains('abc', promises).then(function (contains) {
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
    
    var promise = lag.asPromise(obj);
    
    lag.keys(promise).then(function (keys) {
      expect(keys).to.eql(Object.keys(obj));
      done();
    }).done();
  });
  
  it('#values()', function (done) {
    var obj = {
      key1: 'value1',
      key2: 'value2'
    };
    
    var promise = lag.asPromise(obj);
    
    lag.values(promise).then(function (values) {
      expect(values).to.eql(['value1', 'value2']);
      done();
    }).done();
  });
  
  
  it('#extend()', function (done) {
    var obj = {
      key1: 'value1',
      key2: 'value2'
    };
    
    var promise = lag.asPromise(obj);
    var promiseExtension = lag.asPromise({
      key1: 'value3'
    });
    
    // OOOHHH partial-like
    var extend = lag.extend(promise);
    
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
    
    var valuesPromise = lag.asPromise(obj);
    var defaults = lag.asPromise({
      key1: 'value3',
      key2: 'noop'
    });
    
    lag.defaults(defaults, valuesPromise).then(function (obj) {
      expect(obj).to.eql({
        key1: 'value1',
        key2: 'noop2'
      });
      done();
    }).done();
  });
  
  it('#pick(), get object with only the specified properties', function (done) {
    var promise = lag.asPromise({
      key1: 'value1',
      key2: 'value2',
      key3: 'value3'
    });
    
    lag.pick('key1', 'key3', promise).then(function (res) {
      expect(res).to.eql({key1: 'value1', key3: 'value3'});
      done();
    }).done();
  });
  
  it('#omit(), get object without the specified keys', function (done) {
    var promise = lag.asPromise({
      key1: 'value1',
      key2: 'value2',
      key3: 'value3'
    });
    
    lag.omit('key1', 'key2', promise).then(function (res) {
      expect(res).to.eql({key3: 'value3'});
      done();
    }).done();
  });
  
  it('#zipObject()', function (done) {
    var promise1 = lag.asPromise(['name', 'age']);
    var promise2 = lag.asPromise(['lag', '30']);
    
    lag.zipObject(promise1, promise2).then(function (obj) {
      expect(obj).to.eql({
        name: 'lag',
        age: '30'
      });
      done();
    });
  });
  
});

describe('utilities', function () {
  
  it('#equal()', function (done) {
    var promise1 = lag.asPromise(1);
    var promise2 = lag.asPromise(2);
    
    lag.equal(promise1, promise2).then(function (isEqual) {
      expect(isEqual).to.equal(false);
      done();
    }).done();
  });
  
  it('#greaterThan()', function (done) {
    var promise = lag.asPromise(123);
    
    lag.greaterThan(100, promise).then(function (isGreater) {
      expect(isGreater).to.equal(true);
      done();
    });
  });
  
  it('#lessThan()', function (done) {
    var promise = lag.asPromise(123);
    
    lag.lessThan(200, promise).then(function (isGreater) {
      expect(isGreater).to.equal(true);
      done();
    });
  });
  
});