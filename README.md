# lag

Functional promises. It's like lodash/underscore for promises.

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
var lag = require('lag');
var xhr = require('xhr');

var promises = [
  lag.asPromise(123),
  lag.asPromise(456),
  lag.asPromise(789)
];

var mappedPromises = lag.map(function (promise) {
  return promise.then(function (val) {
    return lag.asPromise(val + 1);
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
