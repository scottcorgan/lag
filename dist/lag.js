(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Promise = require('promise');
var asArray = require('as-array');
var extend = require('extend');
var flatten = require('flat-arguments');
var zipObject = require('zip-object');



var _ = Object.create(null);

// Main method to create new, partialized methods
var register = require('./lib/register');
_.register = function (name, fn, options) {
  return _[name] = register(name, fn, options);
};

_.promise = require('./lib/promise');
_.all = require('./lib/all');
_.partial = require('./lib/partial');
_.identity = require('./lib/identity');
_.boolean = require('./lib/boolean');
_.inverseBoolean = require('./lib/inverse_boolean');
_.compose = require('./lib/compose');

// Arrays

// TODO: combine the "series" and "parallel" versions

_.each = require('./lib/each');
_.eachSeries = require('./lib/each_series');
_.map = require('./lib/map');
_.mapSeries = require('./lib/map_series');
_.reduce = require('./lib/reduce');
_.reduceRight = require('./lib/reduce_right');
_.filter = require('./lib/filter');
_.filterSeries = require('./lib/filter_series');
_.reject = require('./lib/reject');
_.rejectSeries = require('./lib/reject_series');
_.find = require('./lib/find');
_.findSeries = require('./lib/find_series');
_.max = require('./lib/max');
_.min = require('./lib/min');
_.sortBy = require('./lib/sort_by');
_.at = require('./lib/at');
_.compact = require('./lib/compact');
_.first = require('./lib/first');
_.firstValue = _.first.value;
_.last = require('./lib/last');
_.lastValue = _.last.value;
_.initial = require('./lib/initial');
_.initialValues = _.initial.values;

_.tail = function (promises) {
  return _.all(promises.slice(1));
};

_.tailValues = function (promise) {
  return _.first(promise).then(function (arr) {
    arr = asArray(arr);
    return _.promise(arr.slice(1));
  });
};

_.reverse = function (promises) {
  return _.all(promises.reverse());
};

_.reverseValues = function (promise) {
  return _.first(promise).then(function (arr) {
    return _.promise(arr.reverse());
  });
};

// Collections

['where', 'findWhere'].forEach(function (name) {
  _.register(name, function (matchers, promises) {
    var keys = Object.keys(matchers);
    var find = (name === 'where') ? 'filter': 'find';
    
    return _[find](function (promise) {
      return promise.then(function (obj) {
        var matching = false;
        
        keys.forEach(function (key) {
          if (obj[key] === matchers[key]) matching = true;
        });
        
        return _.promise(matching);
      });
    }, promises)
  });
});

_.register('pluck', function (key, promises) {
  return _.all(promises).then(function (res) {
    return _.promise(res.map(function (obj) {
      return obj[key];
    }));
  });
});

_.every = function (promises) {
  return _.compact(promises).then(function (compacted) {
    return _.promise(promises.length === compacted.length);
  });
};

_.some = function (promises) {
  return _
    .find(_.boolean, promises)
    .then(_.boolean);
};

_.register('contains', function (value, promises) {
  return _.find(_.equal(value), promises)
    .then(_.boolean);
});

// Objects

_.keys = function (promise) {
  return _.promise(_.first(promise).then(Object.keys));
};


_.values = function (promise) {
  return _.first(promise)
    .then(function (obj) {
      var values = Object.keys(obj).map(function (key) {
        return obj[key];
      });
    
      return _.promise(values);
    });
};

_.register('extend', function () {
  return _
    .map(_.identity, flatten(arguments))
    .then(function (objects) {
      return _.promise(extend.apply(null, objects));
    });
}, {
  parital: false
});

_.register('defaults', function () {
  return _
    .map(_.identity, flatten(arguments).reverse())
    .then(function (objects) {
      return _.promise(defaults.apply(null, objects));
    });
}, {
  partial: false
});

_.register('pick', function (keys, promise) {
  var returnObj = {};
  
  return _.all(promise, _.all(keys)).then(function (results) {
    var obj = results[0];
    var resolvedKeys = results[1];
    
    resolvedKeys.forEach(function (key) {
      returnObj[key] = obj[key];
    });
    
    return _.promise(returnObj);
  });
});

_.register('omit', function (keys, promise) {
  return _.all(promise, _.all(keys)).then(function (results) {
    var obj = results[0];
    var keysToRemove = results[1];
      
    var keys = _.reject(function (key) {
      return _.contains(key, keysToRemove);
    }, Object.keys(obj));
    
    return _.pick(keys, obj);
  });
});

_.register('zipObject', function (arr1, arr2) {
  return _.all(arr1, arr2)
    .then(function (values) {
      return _.promise(zipObject.apply(null, values));
    });
}, {
  partial: false
});

// Strings

_.register('prepend', function (stringToPrepend, promise) {
  return _.first(promise).then(function (val) {
    return _.promise('' + stringToPrepend + val + '');
  });
});

_.register('append', function (stringToAppend, promise) {
  return _.first(promise).then(function (val) {
    return _.promise('' + val + stringToAppend + '');
  });
});

// Utilities

_.register('equal', operateOnValues(function (a, b) {
  return a === b;
}));

_.register('greaterThan', operateOnValues(function (a, b) {
  return a < b;
}));

_.register('lessThan', operateOnValues(function (a, b) {
  return a > b;
}));

_.register('add', operateOnValues(function (a, b) {
  return a + b;
}));

_.register('subtract', operateOnValues(function (a, b) {
  return b - a;
}));

function operateOnValues(operation) {
  return function (value1, value2) {
    return _.all(value1, value2).then(function (values) {
      return _.promise(operation(values[0], values[1]));
    });
  };
}

_.log = function (promise) {
  return promise.then(function (val) {
    console.log(val);
    return _.promise(val);
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
},{"./lib/all":2,"./lib/at":3,"./lib/boolean":4,"./lib/compact":5,"./lib/compose":6,"./lib/each":7,"./lib/each_series":8,"./lib/filter":9,"./lib/filter_series":10,"./lib/find":11,"./lib/find_series":12,"./lib/first":13,"./lib/identity":14,"./lib/initial":15,"./lib/inverse_boolean":16,"./lib/last":17,"./lib/map":18,"./lib/map_series":19,"./lib/max":20,"./lib/min":21,"./lib/partial":22,"./lib/promise":23,"./lib/reduce":24,"./lib/reduce_right":25,"./lib/register":26,"./lib/reject":27,"./lib/reject_series":28,"./lib/sort_by":29,"as-array":30,"extend":33,"flat-arguments":34,"promise":40,"zip-object":42}],2:[function(require,module,exports){
var Promise = require('promise');
var asArray = require('as-array');

module.exports = function () {
  return Promise.all.apply(null, asArray(arguments));
};
},{"as-array":30,"promise":40}],3:[function(require,module,exports){
var register = require('./register');
var promise = require('./promise');
var filterSeries = require('./filter_series');

module.exports = register('at', function (indexes, promises) {
  return filterSeries(function (value, idx) {
    return promise(indexes.indexOf(idx) > -1);
  }, promises);
});
},{"./filter_series":10,"./promise":23,"./register":26}],4:[function(require,module,exports){
var promise = require('./promise');

module.exports = function (value) {
  return promise(value)
    .then(function (val) {
      return promise(!!val);
    });
};
},{"./promise":23}],5:[function(require,module,exports){
var filter = require('./filter');
var bln = require('./boolean');

module.exports = filter(bln);
},{"./boolean":4,"./filter":9}],6:[function(require,module,exports){
var asArray = require('as-array');
var promise = require('./promise');

module.exports = function () {
  var fns = asArray(arguments).reverse();
  
  return function (promises) {
    return promise(function (resolve, reject) {
      executeFunction(promises)

      function executeFunction (promises) {
        var fn = fns.shift();
        
        return fn
          ? fn(promises).then(executeFunction, reject)
          : resolve(promise(promises));
      };
    });
  };
};
},{"./promise":23,"as-array":30}],7:[function(require,module,exports){
var asArray = require('as-array');
var register = require('./register');
var promise = require('./promise');
var all = require('./all');

module.exports = register('each', function (handler, promises) {
  return all(asArray(promises).map(function (value, idx) {
    return handler(promise(value), idx);
  }));
});
},{"./all":2,"./promise":23,"./register":26,"as-array":30}],8:[function(require,module,exports){
var asArray = require('as-array');
var register = require('./register');
var promise = require('./promise');
var all = require('./all');

module.exports = register('eachSeries', function (handler, promises) {
  var currentPromise = promise(true);
  var p = asArray(promises).map(function (value, idx) {
    return currentPromise = currentPromise.then(function () {
      return handler(promise(value), idx);
    });
  });
    
  return all(p);
});
},{"./all":2,"./promise":23,"./register":26,"as-array":30}],9:[function(require,module,exports){
var register = require('./register');
var each = require('./each');
var all = require('./all');

module.exports = register('filter', function (handler, promises) {
  var filtered = [];
  
  return each(function (promise, idx) {
    return handler(promise, idx).then(function (passed) {
      if (passed) filtered.push(promise);
    });
  }, promises).then(function () {
    return all(filtered);
  });
});
},{"./all":2,"./each":7,"./register":26}],10:[function(require,module,exports){
var register = require('./register');
var eachSeries = require('./each_series');
var all = require('./all');

module.exports = register('filterSeries', function (handler, promises) {
  var filtered = [];
  
  return eachSeries(function (promise, idx) {
    return handler(promise, idx).then(function (passed) {
      if (passed) filtered.push(promise);
    });
  }, promises).then(function () {
    return all(filtered);
  });
});
},{"./all":2,"./each_series":8,"./register":26}],11:[function(require,module,exports){
var register = require('./register');
var each = require('./each');
var promise = require('./promise');

module.exports = register('find', function (handler, promises) {
  var wanted;
  
  return each(function (value, idx) {
    return handler(value, idx).then(function (passed) {
      
      // FIXME: this leaves some promises hanging
      // when no values match
      
      if (passed && !wanted) wanted = value;
    });
  }, promises).then(function () {
    return promise(wanted);
  });
});
},{"./each":7,"./promise":23,"./register":26}],12:[function(require,module,exports){
var register = require('./register');
var eachSeries = require('./each_series');
var promise = require('./promise');

module.exports = register('findSeries', function (handler, promises) {
  var wanted;
  
  return eachSeries(function (value, idx) {
    return handler(value, idx).then(function (passed) {
      
      // FIXME: this leaves some promises hanging
      // when no values match
      
      if (passed && !wanted) wanted = value;
    });
  }, promises).then(function () {
    return promise(wanted);
  });
});
},{"./each_series":8,"./promise":23,"./register":26}],13:[function(require,module,exports){
var asArray = require('as-array');
var promise = require('./promise');

var first = function (promises) {
  return promise(asArray(promises)[0]);
};

first.value = function (value) {
  return first(value).then(function (arr) {
    return promise(asArray(arr)[0]);
  });
};

module.exports = first;
},{"./promise":23,"as-array":30}],14:[function(require,module,exports){
var promise = require('./promise');

module.exports = function () {
  return promise(arguments[0]);
};
},{"./promise":23}],15:[function(require,module,exports){
var asArray = require('as-array');
var all = require('./all');
var promise = require('./promise');
var first = require('./first');

var initial = function (promises) {
  return all(promises.slice(0, promises.length-1));
};

initial.values = function (value) {
  return first(value).then(function (arr) {
    arr = asArray(arr);
    return promise(arr.slice(0, arr.length-1));
  });
};

module.exports = initial;
},{"./all":2,"./first":13,"./promise":23,"as-array":30}],16:[function(require,module,exports){
var promise = require('./promise');
var bln = require('./boolean');

module.exports = function (value) {
  return promise(value)
    .then(bln)
    .then(function (val) {
      return promise(!val);
    });
};
},{"./boolean":4,"./promise":23}],17:[function(require,module,exports){
var asArray = require('as-array');
var promise = require('./promise');
var first = require('./first');

var last = function (promises) {
  return promise(promises[promises.length - 1]);
};

last.value = function (value) {
  return first(value).then(function (arr) {
    arr = asArray(arr);
    return promise(arr[arr.length - 1]);
  });
};

module.exports = last;
},{"./first":13,"./promise":23,"as-array":30}],18:[function(require,module,exports){
var register = require('./register');
var each = require('./each');
var all = require('./all');

module.exports = register('map', function (handler, promises) {
  var mapped = [];
  
  return each(function (promise, idx) {
    return handler(promise, idx).then(mapped.push.bind(mapped));
  }, promises).then(function () {
    return all(mapped);
  });
});

},{"./all":2,"./each":7,"./register":26}],19:[function(require,module,exports){
var register = require('./register');
var eachSeries = require('./each_series');
var all = require('./all');

module.exports = register('mapSeries', function (handler, promises) {
  var mapped = [];
  
  return eachSeries(function (promise, idx) {
    return handler(promise, idx).then(mapped.push.bind(mapped));
  }, promises).then(function () {
    return all(mapped);
  });
});

},{"./all":2,"./each_series":8,"./register":26}],20:[function(require,module,exports){
var all = require('./all');
var promise = require('./promise');

module.exports = function (promises) {
  return all(promises).then(function (values) {
    return promise(Math.max.apply(Math, values));
  });
};
},{"./all":2,"./promise":23}],21:[function(require,module,exports){
var all = require('./all');
var promise = require('./promise');

module.exports = function (promises) {
  return all(promises).then(function (values) {
    return promise(Math.min.apply(Math, values));
  });
};
},{"./all":2,"./promise":23}],22:[function(require,module,exports){
var asArray = require('as-array');

module.exports = function () {
  var partialArgs = asArray(arguments);
  var fn = partialArgs.shift();
  
  return function () {
    var appliedArgs = asArray(arguments);
    return fn.apply(null, partialArgs.concat(appliedArgs));
  };
};
},{"as-array":30}],23:[function(require,module,exports){
var Promise = require('promise');

module.exports = function (value) {
  if (typeof value === 'function') return new Promise(value);
  return Promise.from(value);
};
},{"promise":40}],24:[function(require,module,exports){
var register = require('./register');
var asArray = require('as-array');
var eachSeries = require('./each_series');
var promise = require('./promise');

module.exports = register('reduce', function (handler, promises) {
  promises = asArray(promises);
  
  var accum = promises.shift();
  
  return eachSeries(function (value, idx) {
    return promise(function (resolve, reject) {
      handler(accum, value, idx).then(function (val) {
        accum = promise(val);
        resolve();
      });
    });
  }, promises).then(function () {
    return promise(accum);
  });
});
},{"./each_series":8,"./promise":23,"./register":26,"as-array":30}],25:[function(require,module,exports){
var asArray = require('as-array');
var register = require('./register');
var reduce = require('./reduce');

module.exports = register('reduceRight', function (handler, promises) {
  return reduce(handler, asArray(promises).reverse());
});
},{"./reduce":24,"./register":26,"as-array":30}],26:[function(require,module,exports){
var asArray = require('as-array');
var partial = require('./partial');

// Main method to create new, partialized methods
module.exports = function (name, fn, options) {
  options = options || {};
  
  return function (handler, value) {
    var args = asArray(arguments);
    
    // All arguments
    if (args.length > 1 && !options.partial) return fn.apply(null, args);    
    
    // Partial handler
    args.unshift(fn);
    return partial.apply(null, args);
  };
};
},{"./partial":22,"as-array":30}],27:[function(require,module,exports){
var register = require('./register');
var filter = require('./filter');
var inverseBoolean = require('./inverse_boolean');

module.exports = register('reject', function (handler, promises) {
  return filter(function (promise, idx) {
    return handler(promise, idx)
      .then(inverseBoolean);
  }, promises);
});
},{"./filter":9,"./inverse_boolean":16,"./register":26}],28:[function(require,module,exports){
var register = require('./register');
var filterSeries = require('./filter_series');
var inverseBoolean = require('./inverse_boolean');

module.exports = register('rejectSeries', function (handler, promises) {
  return filterSeries(function (promise, idx) {
    return handler(promise, idx)
      .then(inverseBoolean);
  }, promises);
});
},{"./filter_series":10,"./inverse_boolean":16,"./register":26}],29:[function(require,module,exports){
var register = require('./register');
var map = require('./map');
var promise = require('./promise');

// Sort in ascending order
module.exports = register('sortBy', function (handler, promises) {
  return map(handler, promises).then(function (values) {
    return promise(values.sort(function (a, b) {
      return a - b;
    }));
  });
});
},{"./map":18,"./promise":23,"./register":26}],30:[function(require,module,exports){
var isArgs = require('lodash.isarguments');

module.exports = function (data) {
  if (!data) data = [];
  if (isArgs(data)) data = [].splice.call(data, 0);
  
  return Array.isArray(data)
    ? data
    : [data];
};
},{"lodash.isarguments":31}],31:[function(require,module,exports){
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

},{}],32:[function(require,module,exports){
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

},{}],33:[function(require,module,exports){
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

},{}],34:[function(require,module,exports){
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
},{"as-array":30,"flatten":35,"lodash.isarguments":36,"lodash.isobject":37}],35:[function(require,module,exports){
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

},{}],36:[function(require,module,exports){
module.exports=require(31)
},{}],37:[function(require,module,exports){
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

},{"lodash._objecttypes":38}],38:[function(require,module,exports){
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

},{}],39:[function(require,module,exports){
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

},{"asap":41}],40:[function(require,module,exports){
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

},{"./core.js":39,"asap":41}],41:[function(require,module,exports){
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
},{"/Users/scott/www/modules/lag/node_modules/browserify/node_modules/insert-module-globals/node_modules/process/browser.js":32}],42:[function(require,module,exports){
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