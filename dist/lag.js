(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Promise = require('promise');
var asArray = require('as-array');
var extend = require('extend');
var flatten = require('flat-arguments');
var zipObject = require('zip-object');

var _ = {
  _promiseFirst: false,
  _functionFirst: true
};

// (fn, promise) syntax
_._method = function (name, fn) {
  var method = this[name] = this._partialize(fn);
  return method;
};

// unlimited arguments syntax, but only one passed to initial partial
_._partializedMethod = function (name, fn) {
  return _[name] = function () {
    // if (arguments.length === 1) {
      
    var args = flatten(asArray(arguments));
    
    // Promises or functions first?
    if (_._promiseFirst) args = args.reverse();
    
    // If last argument isn't a promise, this is a partial
    if (args.length === 1) {
      return _.partial(function () {
        return _[name].apply(null, asArray(arguments));
      }, args);
    }
    
    return fn.apply(null, args);
  };
};

_._fnFromArgs = function (args) {
  var fn;
  
  if (_._promiseFirst) fn = args[args.length - 1];
  else fn = args[0];
  
  return fn;
};

_._promisesFromArgs = function (args) {
  var promises;
  
  if (!args[1]) return; // No promises
  if (_._promiseFirst) promises =  flatten([].slice.call(args, 0, args.length -1));
  else promises = flatten([].slice.call(args, 1));
  
  return promises;
};

_._args = function (args) {
  var _args = {};
  
  // object
  if (args[0] && args[0].fn) {
    _args.fn = args[0].fn;
    _args.promises = asArray(args[0].promises);
  }
  
  // probably multiple arguments
  if (args.length >= 1 && !args[0].fn) {
    _args.fn = _._fnFromArgs(args);
    _args.promises = _._promisesFromArgs(args);
  }
  
  // Trun all values into promises
  if (_args.promises) {
    _args.promises = asArray(_args.promises).map(_.asPromise);
  }
  
  return _args;
};

_._partialize = function (callback) {
  return function () {
    var args = _._args(arguments);
    
    args.fn = args.fn || function (promise, resolve) {resolve();};
    
    if (!args.promises) return _.partial(function (fn, promises) {
      var args = _._args(arguments);
      return callback(args);
    }, args.fn);
      
    return callback(args);
  };
};

_.promise = function (fn) {
  return new Promise(fn || function () {});
};

_.asPromise = function (value) {
  return Promise.from(value);
};

_.all = function () {
  return Promise.all.apply(Promise, asArray(arguments));
};

_.partial = function () {
  var partialArgs = asArray(arguments);
  var fn = partialArgs.shift();
  
  return function () {
    var appliedArgs = asArray(arguments);
    return fn.apply(fn, partialArgs.concat(appliedArgs));
  };
};

_.identity = function () {
  return arguments[0];
};

_.boolean = function (promise) {
  return _
    .asPromise(promise)
    .then(function (val) {
      return _.asPromise(!!val);
    });
};

_.inverseBoolean = function (promise) {
  return _.asPromise(promise)
    .then(_.boolean)
    .then(function (val) {
      return _.asPromise(!val);
    });
};

_.compose = function () {
  var fns = asArray(arguments).reverse();
  
  return function (promises) {
    return _.promise(function (resolve, reject) {
      executeFunction(promises)

      function executeFunction (promises) {
        var fn = fns.shift();
        
        return fn
          ? fn(promises).then(executeFunction, reject)
          : resolve(_.asPromise(promises));
      };
    });
  };
};

_._isPromise = function (obj) {
  return obj && typeof obj.then === 'function';
};

_.promiseFirst = function () {
  _._promiseFirst = true;
  _._functionFirst = false;
};

_.functionFirst = function () {
  _._promiseFirst = false;
  _._functionFirst = true;
};

// Arrays

_._method('each', function (args) {
  var eachPromises = args.promises.map(function (promise, idx) {
    return args.fn(promise, idx);
  });
  
  return _.all(eachPromises);  
});

_._method('eachSeries', function (args) {  var _shouldExit = false;
  var currentPromise = _.asPromise(true);
  var promises = args.promises.map(function (promise, idx) {
    return currentPromise = currentPromise.then(function () {
      return args.fn(promise, idx);
    })
  });
    
  return _.all(promises);
});


['map', 'mapSeries'].forEach(function (name) {
  _._method(name, function (args) {
    var mapped = [];
    var each = (name === 'map') ? 'each' : 'eachSeries';
    
    return _[each](function (promise, idx) {
      return args.fn(promise, idx).then(mapped.push.bind(mapped));
    }, args.promises).then(function () {
      return _.all(mapped);
    });
  });
});


_._method('reduce', function (args) {
  var accum = args.promises.shift();
  
  return _.eachSeries(function (promise, idx) {
    return _.promise(function (resolve, reject) {
      args.fn(accum, promise, idx).then(function (val) {
        accum = _.asPromise(val);
        resolve();
      });
    });
  }, args.promises).then(function () {
    return _.asPromise(accum);
  });
});

_._method('reduceRight', function (args) {
  args.promises = args.promises.reverse();
  return _.reduce(args);
});

['filter', 'filterSeries'].forEach(function (name) {
  _._method(name, function (args) {
    var filtered = [];
    var each = (name === 'filter') ? 'each' : 'eachSeries';
    
    return _[each](function (promise, idx) {
      return args.fn(promise, idx).then(function (passed) {
        if (passed) filtered.push(promise);
      });
    }, args.promises).then(function () {
      return _.all(filtered);
    });
  });
});

['reject', 'rejectSeries'].forEach(function (name) {
  _._method(name, function (args) {
    var filter = (name === 'reject') ? 'filter' : 'filterSeries';
    
    return _[filter](function (promise, idx) {
      return args.fn(promise, idx)
        .then(_.inverseBoolean);
    }, args.promises);
  });
});


['find', 'findSeries'].forEach(function (name) {
  _._method(name, function (args) {
    var wanted;
    var each = (name === 'find') ? 'each': 'eachSeries';
    
    return _[each](function (promise, idx) {
      return args.fn(promise, idx).then(function (passed) {
        
        // FIXME: this leaves some promises hanging
        // when no values match
        
        // if (passed && !wanted) resolve(promise);
        if (passed && !wanted) wanted = promise;
      });
    }, args.promises).then(function () {
      return _.asPromise(wanted);
    });
  });
});


_.compact = _.filter(_.boolean);

_.first = function (promises) {
  return _.asPromise(asArray(promises)[0]);
};

_.firstValue = function (promise) {
  return _.first(promise).then(function (arr) {
    return _.asPromise(asArray(arr)[0]);
  });
};

_.last = function (promises) {
  return _.asPromise(promises[promises.length - 1]);
};

_.lastValue = function (promise) {
  return _.first(promise).then(function (arr) {
    arr = asArray(arr);
    return _.asPromise(arr[arr.length - 1]);
  });
};

_.initial = function (promises) {
  return _.all(promises.slice(0, promises.length-1));
};

_.initialValues = function (promise) {
  return _.first(promise).then(function (arr) {
    arr = asArray(arr);
    return _.asPromise(arr.slice(0, arr.length-1));
  });
};

_.tail = function (promises) {
  return _.all(promises.slice(1));
};

_.tailValues = function (promise) {
  return _.first(promise).then(function (arr) {
    arr = asArray(arr);
    return _.asPromise(arr.slice(1));
  });
};

_.reverse = function (promises) {
  return _.all(promises.reverse());
};

_.reverseValues = function (promise) {
  return _.first(promise).then(function (arr) {
    return _.asPromise(arr.reverse());
  });
};

// Collections

['where', 'findWhere'].forEach(function (name) {
  _._method(name, function (args) {
    var where = args.fn;
    var keys = Object.keys(where);
    var find = (name === 'where') ? 'filter': 'find';
    
    return _[find](function (promise) {
      return promise.then(function (obj) {
        var matching = false;
        
        keys.forEach(function (key) {
          if (obj[key] === where[key]) matching = true;
        });
        
        return _.asPromise(matching);
        });
    }, args.promises)
  });
});

_._method('pluck', function (args) {
  return _.all(args.promises).then(function (res) {
    return _.asPromise(res.map(function (obj) {
      return obj[args.fn];
    }));
  });
});

_.every = function (promises) {
  return _.compact(promises).then(function (compacted) {
    return _.asPromise(promises.length === compacted.length);
  });
};

_.some = function (promises) {
  return _
    .find(_.boolean, promises)
    .then(_.boolean);
};

_._method('contains', function (args) {
  var value = args.fn;
  
  return _
    .find(_.equal(value), args.promises)
    .then(_.boolean);
});

// Objects

_.keys = function (promise) {
  return _.first(promise)
    .then(function (obj) {
      return _.asPromise(Object.keys(obj));
    });
};


_.values = function (promise) {
  return _.first(promise)
    .then(function (obj) {
      var values = Object.keys(obj).map(function (key) {
        return obj[key];
      });
    
      return _.asPromise(values);
    });
};

_._partializedMethod('extend', function () {
  return _
    .map(_.identity, flatten(arguments))
    .then(function (objects) {
      return _.asPromise(extend.apply(null, objects));
    });
});

_._partializedMethod('defaults', function () {
  return _
    .map(_.identity, flatten(arguments).reverse())
    .then(function (objects) {
      return _.asPromise(defaults.apply(null, objects));
    });
});

// TODO: make these
// _._methodWithMultipleFns
// _._methodWithMultiplePromises

_._partializedMethod('pick', function () {
  var args = asArray(arguments);
  
  return _.last(args).then(function (obj) {
    return _.initial(args).then(function (keys) {
      var returnObj = {};
      
      keys.forEach(function (key) {
        returnObj[key] = obj[key];
      });
      
      return _.asPromise(returnObj);
    });
  });
});

_._partializedMethod('omit', function () {
  var args = asArray(arguments);
  
  return _.last(args).then(function (obj) {
    return _.initial(args).then(function (keysToRemove) {      
      
      var keys = _.reject(function (key) {
        return _.contains(key, keysToRemove);
      }, Object.keys(obj));
      
      return _.pick(keys, obj);
    });
  });
});

_.zipObject = function (arr1, arr2) {
  return _.all(arr1, arr2)
    .then(function (values) {
      return _.asPromise(zipObject.apply(null, values));
    });
};

// Strings

_._method('prepend', function (args) {
  return _.first(args.promises).then(function (val) {
    return _.asPromise('' + args.fn + val + '');
  });
});

_._method('append', function (args) {
  return _.first(args.promises).then(function (val) {
    return _.asPromise('' + val + args.fn + '');
  });
});

// Utilities

_._method('equal', operateOnValues(function (a, b) {
  return a === b;
}));

_._method('greaterThan', operateOnValues(function (a, b) {
  return a < b;
}));

_._method('lessThan', operateOnValues(function (a, b) {
  return a > b;
}));

_._method('add', operateOnValues(function (a, b) {
  return a + b;
}));

_._method('subtract', operateOnValues(function (a, b) {
  return b - a;
}));

function operateOnValues(operation) {
  return function (args) {
    return _.all(args.fn, args.promises[0]).then(function (values) {
      return _.asPromise(operation(values[0], values[1]));
    });
  };
}

_.log = function (promise) {
  return promise.then(function (val) {
    console.log(val);
    return _.asPromise(val);
  });
};

module.exports = _;

function defaults (options, defaults) {
  options = options || {};

  Object.keys(defaults).forEach(function(key) {
    if (typeof options[key] === 'undefined') {
      options[key] = defaults[key];
    }
  });

  return options;
};
},{"as-array":2,"extend":5,"flat-arguments":6,"promise":12,"zip-object":14}],2:[function(require,module,exports){
var isArgs = require('lodash.isarguments');

module.exports = function (data) {
  if (!data) data = [];
  if (isArgs(data)) data = [].splice.call(data, 0);
  
  return Array.isArray(data)
    ? data
    : [data];
};
},{"lodash.isarguments":3}],3:[function(require,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="npm" -o ./npm/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */

/** `Object#toString` result shortcuts */
var argsClass = '[object Arguments]';

/** Used for native method references */
var objectProto = Object.prototype;

/** Used to resolve the internal [[Class]] of values */
var toString = objectProto.toString;

/**
 * Checks if `value` is an `arguments` object.
 *
 * @static
 * @memberOf _
 * @category Objects
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if the `value` is an `arguments` object, else `false`.
 * @example
 *
 * (function() { return _.isArguments(arguments); })(1, 2, 3);
 * // => true
 *
 * _.isArguments([1, 2, 3]);
 * // => false
 */
function isArguments(value) {
  return value && typeof value == 'object' && typeof value.length == 'number' &&
    toString.call(value) == argsClass || false;
}

module.exports = isArguments;

},{}],4:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],5:[function(require,module,exports){
var hasOwn = Object.prototype.hasOwnProperty;
var toString = Object.prototype.toString;

function isPlainObject(obj) {
	if (!obj || toString.call(obj) !== '[object Object]' || obj.nodeType || obj.setInterval)
		return false;

	var has_own_constructor = hasOwn.call(obj, 'constructor');
	var has_is_property_of_method = hasOwn.call(obj.constructor.prototype, 'isPrototypeOf');
	// Not own constructor property must be Object
	if (obj.constructor && !has_own_constructor && !has_is_property_of_method)
		return false;

	// Own properties are enumerated firstly, so to speed up,
	// if last one is own, then all properties are own.
	var key;
	for ( key in obj ) {}

	return key === undefined || hasOwn.call( obj, key );
};

module.exports = function extend() {
	var options, name, src, copy, copyIsArray, clone,
	    target = arguments[0] || {},
	    i = 1,
	    length = arguments.length,
	    deep = false;

	// Handle a deep copy situation
	if ( typeof target === "boolean" ) {
		deep = target;
		target = arguments[1] || {};
		// skip the boolean and the target
		i = 2;
	}

	// Handle case when target is a string or something (possible in deep copy)
	if ( typeof target !== "object" && typeof target !== "function") {
		target = {};
	}

	for ( ; i < length; i++ ) {
		// Only deal with non-null/undefined values
		if ( (options = arguments[ i ]) != null ) {
			// Extend the base object
			for ( name in options ) {
				src = target[ name ];
				copy = options[ name ];

				// Prevent never-ending loop
				if ( target === copy ) {
					continue;
				}

				// Recurse if we're merging plain objects or arrays
				if ( deep && copy && ( isPlainObject(copy) || (copyIsArray = Array.isArray(copy)) ) ) {
					if ( copyIsArray ) {
						copyIsArray = false;
						clone = src && Array.isArray(src) ? src : [];

					} else {
						clone = src && isPlainObject(src) ? src : {};
					}

					// Never move original objects, clone them
					target[ name ] = extend( deep, clone, copy );

				// Don't bring in undefined values
				} else if ( copy !== undefined ) {
					target[ name ] = copy;
				}
			}
		}
	}

	// Return the modified object
	return target;
};

},{}],6:[function(require,module,exports){
var asArray = require('as-array');
var flatten = require('flatten');
var isArguments = require('lodash.isarguments');
var isObject = require('lodash.isobject');

var flattenArguments = function () {
  return flatten(argumentsToArray(arguments));
};

function argumentsToArray (args) {
  return asArray(args)
    .map(function (arg) {
      if (!isArguments(arg)) return arg;
      if (isObject(arg)) arg = argumentsToArray(arg);
      
      return asArray(arg);
    });
}

module.exports = flattenArguments;
},{"as-array":2,"flatten":7,"lodash.isarguments":8,"lodash.isobject":9}],7:[function(require,module,exports){
module.exports = function flatten(list, depth) {
  depth = (typeof depth == 'number') ? depth : Infinity;

  return _flatten(list, 1);

  function _flatten(list, d) {
    return list.reduce(function (acc, item) {
      if (Array.isArray(item) && d < depth) {
        return acc.concat(_flatten(item, d + 1));
      }
      else {
        return acc.concat(item);
      }
    }, []);
  }
};

},{}],8:[function(require,module,exports){
module.exports=require(3)
},{}],9:[function(require,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="npm" -o ./npm/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */
var objectTypes = require('lodash._objecttypes');

/**
 * Checks if `value` is the language type of Object.
 * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @category Objects
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if the `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(1);
 * // => false
 */
function isObject(value) {
  // check if the value is the ECMAScript language type of Object
  // http://es5.github.io/#x8
  // and avoid a V8 bug
  // http://code.google.com/p/v8/issues/detail?id=2291
  return !!(value && objectTypes[typeof value]);
}

module.exports = isObject;

},{"lodash._objecttypes":10}],10:[function(require,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="npm" -o ./npm/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */

/** Used to determine if values are of the language type Object */
var objectTypes = {
  'boolean': false,
  'function': true,
  'object': true,
  'number': false,
  'string': false,
  'undefined': false
};

module.exports = objectTypes;

},{}],11:[function(require,module,exports){
'use strict';

var asap = require('asap')

module.exports = Promise
function Promise(fn) {
  if (typeof this !== 'object') throw new TypeError('Promises must be constructed via new')
  if (typeof fn !== 'function') throw new TypeError('not a function')
  var state = null
  var value = null
  var deferreds = []
  var self = this

  this.then = function(onFulfilled, onRejected) {
    return new Promise(function(resolve, reject) {
      handle(new Handler(onFulfilled, onRejected, resolve, reject))
    })
  }

  function handle(deferred) {
    if (state === null) {
      deferreds.push(deferred)
      return
    }
    asap(function() {
      var cb = state ? deferred.onFulfilled : deferred.onRejected
      if (cb === null) {
        (state ? deferred.resolve : deferred.reject)(value)
        return
      }
      var ret
      try {
        ret = cb(value)
      }
      catch (e) {
        deferred.reject(e)
        return
      }
      deferred.resolve(ret)
    })
  }

  function resolve(newValue) {
    try { //Promise Resolution Procedure: https://github.com/promises-aplus/promises-spec#the-promise-resolution-procedure
      if (newValue === self) throw new TypeError('A promise cannot be resolved with itself.')
      if (newValue && (typeof newValue === 'object' || typeof newValue === 'function')) {
        var then = newValue.then
        if (typeof then === 'function') {
          doResolve(then.bind(newValue), resolve, reject)
          return
        }
      }
      state = true
      value = newValue
      finale()
    } catch (e) { reject(e) }
  }

  function reject(newValue) {
    state = false
    value = newValue
    finale()
  }

  function finale() {
    for (var i = 0, len = deferreds.length; i < len; i++)
      handle(deferreds[i])
    deferreds = null
  }

  doResolve(fn, resolve, reject)
}


function Handler(onFulfilled, onRejected, resolve, reject){
  this.onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : null
  this.onRejected = typeof onRejected === 'function' ? onRejected : null
  this.resolve = resolve
  this.reject = reject
}

/**
 * Take a potentially misbehaving resolver function and make sure
 * onFulfilled and onRejected are only called once.
 *
 * Makes no guarantees about asynchrony.
 */
function doResolve(fn, onFulfilled, onRejected) {
  var done = false;
  try {
    fn(function (value) {
      if (done) return
      done = true
      onFulfilled(value)
    }, function (reason) {
      if (done) return
      done = true
      onRejected(reason)
    })
  } catch (ex) {
    if (done) return
    done = true
    onRejected(ex)
  }
}

},{"asap":13}],12:[function(require,module,exports){
'use strict';

//This file contains then/promise specific extensions to the core promise API

var Promise = require('./core.js')
var asap = require('asap')

module.exports = Promise

/* Static Functions */

function ValuePromise(value) {
  this.then = function (onFulfilled) {
    if (typeof onFulfilled !== 'function') return this
    return new Promise(function (resolve, reject) {
      asap(function () {
        try {
          resolve(onFulfilled(value))
        } catch (ex) {
          reject(ex);
        }
      })
    })
  }
}
ValuePromise.prototype = Object.create(Promise.prototype)

var TRUE = new ValuePromise(true)
var FALSE = new ValuePromise(false)
var NULL = new ValuePromise(null)
var UNDEFINED = new ValuePromise(undefined)
var ZERO = new ValuePromise(0)
var EMPTYSTRING = new ValuePromise('')

Promise.from = Promise.cast = function (value) {
  if (value instanceof Promise) return value

  if (value === null) return NULL
  if (value === undefined) return UNDEFINED
  if (value === true) return TRUE
  if (value === false) return FALSE
  if (value === 0) return ZERO
  if (value === '') return EMPTYSTRING

  if (typeof value === 'object' || typeof value === 'function') {
    try {
      var then = value.then
      if (typeof then === 'function') {
        return new Promise(then.bind(value))
      }
    } catch (ex) {
      return new Promise(function (resolve, reject) {
        reject(ex)
      })
    }
  }

  return new ValuePromise(value)
}
Promise.denodeify = function (fn, argumentCount) {
  argumentCount = argumentCount || Infinity
  return function () {
    var self = this
    var args = Array.prototype.slice.call(arguments)
    return new Promise(function (resolve, reject) {
      while (args.length && args.length > argumentCount) {
        args.pop()
      }
      args.push(function (err, res) {
        if (err) reject(err)
        else resolve(res)
      })
      fn.apply(self, args)
    })
  }
}
Promise.nodeify = function (fn) {
  return function () {
    var args = Array.prototype.slice.call(arguments)
    var callback = typeof args[args.length - 1] === 'function' ? args.pop() : null
    try {
      return fn.apply(this, arguments).nodeify(callback)
    } catch (ex) {
      if (callback === null || typeof callback == 'undefined') {
        return new Promise(function (resolve, reject) { reject(ex) })
      } else {
        asap(function () {
          callback(ex)
        })
      }
    }
  }
}

Promise.all = function () {
  var args = Array.prototype.slice.call(arguments.length === 1 && Array.isArray(arguments[0]) ? arguments[0] : arguments)

  return new Promise(function (resolve, reject) {
    if (args.length === 0) return resolve([])
    var remaining = args.length
    function res(i, val) {
      try {
        if (val && (typeof val === 'object' || typeof val === 'function')) {
          var then = val.then
          if (typeof then === 'function') {
            then.call(val, function (val) { res(i, val) }, reject)
            return
          }
        }
        args[i] = val
        if (--remaining === 0) {
          resolve(args);
        }
      } catch (ex) {
        reject(ex)
      }
    }
    for (var i = 0; i < args.length; i++) {
      res(i, args[i])
    }
  })
}

/* Prototype Methods */

Promise.prototype.done = function (onFulfilled, onRejected) {
  var self = arguments.length ? this.then.apply(this, arguments) : this
  self.then(null, function (err) {
    asap(function () {
      throw err
    })
  })
}

Promise.prototype.nodeify = function (callback) {
  if (callback === null || typeof callback == 'undefined') return this

  this.then(function (value) {
    asap(function () {
      callback(null, value)
    })
  }, function (err) {
    asap(function () {
      callback(err)
    })
  })
}

Promise.prototype.catch = function (onRejected) {
  return this.then(null, onRejected);
}


Promise.resolve = function (value) {
  return new Promise(function (resolve) { 
    resolve(value);
  });
}

Promise.reject = function (value) {
  return new Promise(function (resolve, reject) { 
    reject(value);
  });
}

Promise.race = function (values) {
  return new Promise(function (resolve, reject) { 
    values.map(function(value){
      Promise.cast(value).then(resolve, reject);
    })
  });
}

},{"./core.js":11,"asap":13}],13:[function(require,module,exports){
(function (process){

// Use the fastest possible means to execute a task in a future turn
// of the event loop.

// linked list of tasks (single, with head node)
var head = {task: void 0, next: null};
var tail = head;
var flushing = false;
var requestFlush = void 0;
var isNodeJS = false;

function flush() {
    /* jshint loopfunc: true */

    while (head.next) {
        head = head.next;
        var task = head.task;
        head.task = void 0;
        var domain = head.domain;

        if (domain) {
            head.domain = void 0;
            domain.enter();
        }

        try {
            task();

        } catch (e) {
            if (isNodeJS) {
                // In node, uncaught exceptions are considered fatal errors.
                // Re-throw them synchronously to interrupt flushing!

                // Ensure continuation if the uncaught exception is suppressed
                // listening "uncaughtException" events (as domains does).
                // Continue in next event to avoid tick recursion.
                if (domain) {
                    domain.exit();
                }
                setTimeout(flush, 0);
                if (domain) {
                    domain.enter();
                }

                throw e;

            } else {
                // In browsers, uncaught exceptions are not fatal.
                // Re-throw them asynchronously to avoid slow-downs.
                setTimeout(function() {
                   throw e;
                }, 0);
            }
        }

        if (domain) {
            domain.exit();
        }
    }

    flushing = false;
}

if (typeof process !== "undefined" && process.nextTick) {
    // Node.js before 0.9. Note that some fake-Node environments, like the
    // Mocha test runner, introduce a `process` global without a `nextTick`.
    isNodeJS = true;

    requestFlush = function () {
        process.nextTick(flush);
    };

} else if (typeof setImmediate === "function") {
    // In IE10, Node.js 0.9+, or https://github.com/NobleJS/setImmediate
    if (typeof window !== "undefined") {
        requestFlush = setImmediate.bind(window, flush);
    } else {
        requestFlush = function () {
            setImmediate(flush);
        };
    }

} else if (typeof MessageChannel !== "undefined") {
    // modern browsers
    // http://www.nonblocking.io/2011/06/windownexttick.html
    var channel = new MessageChannel();
    channel.port1.onmessage = flush;
    requestFlush = function () {
        channel.port2.postMessage(0);
    };

} else {
    // old browsers
    requestFlush = function () {
        setTimeout(flush, 0);
    };
}

function asap(task) {
    tail = tail.next = {
        task: task,
        domain: isNodeJS && process.domain,
        next: null
    };

    if (!flushing) {
        flushing = true;
        requestFlush();
    }
};

module.exports = asap;


}).call(this,require("/Users/scott/www/modules/lag/node_modules/browserify/node_modules/insert-module-globals/node_modules/process/browser.js"))
},{"/Users/scott/www/modules/lag/node_modules/browserify/node_modules/insert-module-globals/node_modules/process/browser.js":4}],14:[function(require,module,exports){
var zipObject = function (keys, values) {
  if (arguments.length == 1) {
    values = keys[1];
    keys = keys[0];
  }
    
  var result = {};
  var i = 0;
  
  for (i; i < keys.length; i += 1) {
    result[keys[i]] = values[i];
  }
  
  return result;
};

module.exports = zipObject;
},{}]},{},[1])