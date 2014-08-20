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

* **[Arrays](#arrays)**
  * [each](#eachfn-promises)
  * [each.series](#eachseriesfn-promises)
  * [map](#mapfn-promises)
  * [mapSeries](#mapseriesfn-promises)
  * [filter](#filterfn-promises)
  * [filterSeries](#filterseriesfn-promises)
  * [reject](#rejectfn-promises)
  * [rejectSeries](#rejectseriesfn-promises)
  * [find](#findfn-promises)
  * [findSeries](#findseriesfn-promises)
  * [reduce](#reducefn-promises)
  * [reduceRight](#reducerightfn-promises)
  * [first](#firstpromises)
  * [firstValue](#firstvaluepromise)
  * [last](#lastpromises)
  * [lastValue](#lastvaluepromise)
  * [initial](#initialpromises)
  * [initialValues](#initialvaluespromise)
  * [tail](#tailpromises)
  * [tailValues](#tailvaluespromise)
  * [reverse](#reversepromises)
  * [reverseValues](#reversevaluespromise)
  * [compact](#compactpromises)
* **[Collections](#collections)**
  * [where](#whereobject-promises)
  * [findWhere](#findwhereobject-promises)
  * [pluck](#pluckkeys-promises)
  * [every](#everypromises)
  * [some](#somepromises)
  * [contains](#containskeys-promises)
* **[Objects](#objects)**
  * [keys](#keyspromise)
  * [values](#valuespromise)
  * [extend](#extendpromise-object1-objectn-)
  * [defaults](#defaultsdefaults-promise1-promisen-)
  * [pick](#pickkey1-keyn--promise)
  * [omit](#omitkey1-keyn--promise)
* **[Numbers](#nubmers)**
  * [greaterThan](#greaterthannumber-promise)
  * [lessThan](#lessthannumber-promise)
  * [equal](#equalpromise1-promise2)
  * [add](#addnumber-promise)
  * [subtract](#subtractnumber-promise)
* **[Strings](#strings)**
  * [prepend](#prependpromise)
  * [append](#appendpromise)
* **[Utilities](#utilities)**
  * [promise](#promisefunction)
  * [asPromise](#aspromisevalue)
  * [all](#allpromise1-promise2-promisen-) (alias of "when")
  * [when](#whenpromise1-promise2-promisen-) (alias of "all")
  * [partial](#partialfunction-value1-valuen-)
  * [boolean](#booleanvalue)
  * [inverseBoolean](#inversebooleanvalue)
  * [compose](#composemethod1-method2-methodn-)


## Arrays

### each(fn, promises)

### each.series(fn, promises)

### map(fn, promises)

### mapSeries(fn, promises)

### filter(fn, promises)

### filterSeries(fn, promises)

### reject(fn, promises)

### rejectSeries(fn, promises)

### find(fn, promises)

### findSeries(fn, promises)

### reduce(fn, promises)

### reduceRight(fn, promises)

### first(promises)

### firstValue(promise)

### last(promises)

### lastValue(promise)

### initial(promises)

### initialValues(promise)

### tail(promises)

### tailValues(promise)

### reverse(promises)

### reverseValues(promise)

### compact(promises)


## Collections

### where(object, promises)

### findWhere(object, promises)

### pluck(keys, promises)

### every(promises)

### some(promises)

### contains(keys, promises)


## Objects

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


## Strings

### prepend(promise)

### append(promise)


## Utilities

### promise(function)

### asPromise(value)

### all(promise1[, promise2, promisen, ...])

### when(promise1[, promise2, promisen, ...])

### partial(function[, value1, valuen, ...])

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
