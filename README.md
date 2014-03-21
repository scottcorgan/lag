# lag

Functional promises. It's like [lodash](https://www.npmjs.org/package/lodash)/[underscore](https://www.npmjs.org/package/underscore) for promises.

Using promises as functional values allows the developer to write asynchronous code in a synchronous way.

**Method signature**

`lag.methodName(function, promise_array)`

Lag uses the "function first" method signature in order to take advantage of the functional approach to programming. If you prefer the put the values first and the method second, you can call the `lag.promiseFirst()` method to switch the parameter order.

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
  _.asPromise(789)
];

_.map(function (promise) {
  return promise.then(function (val) {
    return _.asPromise(val + 1);
  });
}, promises)
.then(_.filter(_.lessThan(400)))
.then(function (values) {
	// values === [123]
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
* **Utilities**
  * [promise]()
  * [asPromise]()
  * [all]()
  * [partial]()
  * [identity]()
  * [boolean]()
  * [inverseBoolean]()
  * [compose]()
* **Numbers**
  * [greaterThan]()
  * [lessThan]()
  * [equal]()
  


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
