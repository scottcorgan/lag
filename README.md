# lag

Functional promises. It's like [lodash](https://www.npmjs.org/package/lodash)/[underscore](https://www.npmjs.org/package/underscore) for promises.

Using promises as functional values allows the developer to write asynchronous code in a synchronous way.

**Method signature**

`lag.methodName(function, promise_array)`

Lag uses the "function first" method signature in order to take advantage of the functional approach to programming. If you prefer the put the values first and the method second, you can call the `lab.promiseFirst()` method to switch the parameter order.

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

var mappedPromises = _.map(function (promise) {
  return promise.then(function (val) {
    return _.asPromise(val + 1);
  });
}, promises).then(function (values) {
  // values === [124, 457, 790]
});
```

## Methods

(Coming soon)

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
