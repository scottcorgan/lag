# lag

Functional promises. It's like [lodash](https://www.npmjs.org/package/lodash)/[underscore](https://www.npmjs.org/package/underscore) for promises.

Using promises as functional values allows the developer to write asynchronous code in a synchronous way.

**Method signature**

`lag.methodName(function, promise_array)`

Lag uses the "function first" method signature in order to take advantage of the functional approach to programming.

If you prefer the put the values first and the method second, you can call the `lag.promiseFirst()` method to switch the parameter order to `lag.methodName(promise_array, function)`.

## Install

NPM

```
npm install lag --save
```

Bower

```
bower install lag --save
```

## Example Usage

```js
var _ = require('lag');
var xhr = require('xhr');

var promises = [
  _.asPromise(123),
  _.asPromise(456),
  _.promise(function (resolve, reject) {
    http.get('http://someapi.com', function (err, res) {
      if (err) return reject(err);
      resolve(res)
    });
  })
];

_.map(_.add(1), promises)
.then(_.filter(_.lessThan(400)))
.then(function (values) {
	// values === [124]
});
```

## Methods

* **Arrays**
  * [each]()
  * [eachSeries]()
  * [map]()
  * [mapSeries]()
  * [filter]()
  * [filterSeries]()
  * [reject]()
  * [rejectSeries]()
  * [find]()
  * [findSeries]()
  * [reduce]()
  * [reduceRight]()
  * [first]()
  * [last]()
  * [initial]()
  * [rest]()
  * [compact]()
* **Collections**
  * [where]()
  * [findWhere]()
  * [pluck]()
  * [every]()
  * [some]()
  * [contains]()
* **Objects**
  * [keys]()
  * [values]()
  * [extend]()
  * [defaults]()
  * [pick]()
  * [omit]()
* **Numbers**
  * [greaterThan]()
  * [lessThan]()
  * [equal]()
  * [add]()
  * [subtract]()
* **Utilities**
  * [promise]()
  * [asPromise]()
  * [all]()
  * [partial]()
  * [identity]()
  * [boolean]()
  * [inverseBoolean]()
  * [compose]()


## Arrays

### each(fn, promises)

### eachSeries(fn, promises)

### map(fn, promises)

### mapSeries(fn, promises)

### filter(fn, promises);

### filterSeries(fn, promises);

### reject(fn, promises);

### rejectSeries(fn, promises);

### find(fn, promises);

### findSeries(fn, promises);

### reduce(fn, promises);

### reduceRight(fn, promises);

### first(promises);

### last(promises)

### intiial(promises);

### rest(promises);

### compact(promises);


## Collections

### where(object, promises)

### findWhere(object, promises)

### pluck(keys, promises)

### every(promises)

### some(promises)

### contains(keys, promises)


### Objects

### keys(promise)

### values(promise)

### extend(promise[, object1, objectn, ...])

### defaults(defaults[, promise1, promisen, ...])

### pick(key1[, keyn, ...], promise)

### omit(key1[, keyn, ...], promise)


## Nubmers

### greaterThan(number, promise)

### lessThan(number, promise)

### equal(promise1, promise2)

### add(number, promise)

### subtract(number, promise)


## Utilities

### promise(function)

### asPromise(value)

### all(promise1[, promise2, promisen, ...])

### partial(function[, value1, valuen, ...])

### identity(value)

### boolean(value)

### inverseBoolean(value)

### compose(method1[, method2, methodn, ...])


## Build

```
npm install
npm run build
```

## Run Tests

```
npm install
npm test
```
