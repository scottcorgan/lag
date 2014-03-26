(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var lag = Object.create(null);

lag.register = require('./lib/register');
lag.promise = require('./lib/promise');
lag.all = require('./lib/all');
lag.partial = require('./lib/partial');
lag.identity = require('./lib/identity');
lag.boolean = require('./lib/boolean');
lag.inverseBoolean = require('./lib/inverse_boolean');
lag.compose = require('./lib/compose');

// Arrays

lag.each = require('./lib/each');
lag.map = require('./lib/map');
lag.reduce = require('./lib/reduce');
lag.reduceRight = require('./lib/reduce_right');
lag.filter = require('./lib/filter');
lag.reject = require('./lib/reject');
lag.find = require('./lib/find');
lag.max = require('./lib/max');
lag.min = require('./lib/min');
lag.sortBy = require('./lib/sort_by');
lag.at = require('./lib/at');
lag.compact = require('./lib/compact');
lag.first = require('./lib/first');
lag.firstValue = lag.first.value;
lag.last = require('./lib/last');
lag.lastValue = lag.last.value;
lag.initial = require('./lib/initial');
lag.initialValues = lag.initial.values;
lag.tail = require('./lib/tail');
lag.tailValues = lag.tail.values;
lag.reverse = require('./lib/reverse');
lag.reverseValues = lag.reverse.values;

// Collections

lag.where = require('./lib/where');
lag.findWhere = require('./lib/find_where');
lag.pluck = require('./lib/pluck');
lag.every = require('./lib/every');
lag.some = require('./lib/some');
lag.contains = require('./lib/contains');

// Objects

lag.keys = require('./lib/keys');
lag.values = require('./lib/values');
lag.extend = require('./lib/extend');
lag.defaults = require('./lib/defaults');
lag.pick = require('./lib/pick');
lag.omit = require('./lib/omit');
lag.zipObject = require('./lib/zip_object');

// Strings

lag.prepend = require('./lib/prepend');
lag.append = require('./lib/append');

// Utilities

lag.equal = require('./lib/equal');
lag.greaterThan = require('./lib/greater_than');
lag.lessThan = require('./lib/less_than');
lag.add = require('./lib/add');
lag.subtract = require('./lib/subtract');
lag.log = require('./lib/log');

module.exports = lag;
},{"./lib/add":2,"./lib/all":3,"./lib/append":4,"./lib/at":5,"./lib/boolean":6,"./lib/compact":7,"./lib/compose":8,"./lib/contains":9,"./lib/defaults":10,"./lib/each":11,"./lib/equal":12,"./lib/every":13,"./lib/extend":14,"./lib/filter":15,"./lib/find":16,"./lib/find_where":17,"./lib/first":18,"./lib/greater_than":19,"./lib/identity":20,"./lib/initial":21,"./lib/inverse_boolean":22,"./lib/keys":23,"./lib/last":24,"./lib/less_than":25,"./lib/log":26,"./lib/map":27,"./lib/max":28,"./lib/min":29,"./lib/omit":30,"./lib/partial":31,"./lib/pick":32,"./lib/pluck":33,"./lib/prepend":34,"./lib/promise":35,"./lib/reduce":36,"./lib/reduce_right":37,"./lib/register":38,"./lib/reject":39,"./lib/reverse":40,"./lib/some":41,"./lib/sort_by":42,"./lib/subtract":43,"./lib/tail":44,"./lib/values":45,"./lib/where":46,"./lib/zip_object":47}],2:[function(require,module,exports){
var register = require('./register');

module.exports = register.operateOnValues(function (a, b) {
  return a + b;
});
},{"./register":38}],3:[function(require,module,exports){
var Promise = require('promise');
var asArray = require('as-array');

module.exports = function () {
  return Promise.all.apply(null, asArray(arguments));
};
},{"as-array":48,"promise":53}],4:[function(require,module,exports){
var register = require('./register');
var first = require('./first');
var promise = require('./promise');

module.exports = register('append', function (stringToAppend, value) {
  return first(value).then(function (val) {
    return promise('' + val + stringToAppend + '');
  });
});
},{"./first":18,"./promise":35,"./register":38}],5:[function(require,module,exports){
var register = require('./register');
var promise = require('./promise');
var filter = require('./filter');

module.exports = register('at', function (indexes, promises) {
  return filter.series(function (value, idx) {
    return promise(indexes.indexOf(idx) > -1);
  }, promises);
});
},{"./filter":15,"./promise":35,"./register":38}],6:[function(require,module,exports){
var promise = require('./promise');

module.exports = function (value) {
  return promise(value)
    .then(function (val) {
      return promise(!!val);
    });
};
},{"./promise":35}],7:[function(require,module,exports){
var filter = require('./filter');
var bln = require('./boolean');

module.exports = filter(bln);
},{"./boolean":6,"./filter":15}],8:[function(require,module,exports){
var asArray = require('as-array');
var promise = require('./promise');

module.exports = function () {
  var fns = asArray(arguments).reverse();
  
  return function (promises) {
    return promise(function (resolve, reject) {
      executeFunction(promises);

      function executeFunction (promises) {
        var fn = fns.shift();
        
        return fn
          ? fn(promises).then(executeFunction, reject)
          : resolve(promise(promises));
      }
    });
  };
};
},{"./promise":35,"as-array":48}],9:[function(require,module,exports){
var register = require('./register');
var find = require('./find');
var equal = require('./equal');
var bln = require('./boolean');

module.exports = register('contains', function (value, promises) {
  return find(equal(value), promises).then(bln);
});
},{"./boolean":6,"./equal":12,"./find":16,"./register":38}],10:[function(require,module,exports){
var asArray = require('as-array');
var register = require('./register');
var identity = require('./identity');
var map = require('./map');
var promise = require('./promise');

module.exports = register('defaults', function () {
  return map(identity, asArray(arguments).reverse())
    .then(function (objects) {
      return promise(defaults.apply(null, objects));
    });
}, {
  partial: false
});

function defaults (options, _defaults) {
  options = options || {};

  Object.keys(_defaults).forEach(function(key) {
    if (typeof options[key] === 'undefined') {
      options[key] = _defaults[key];
    }
  });

  return options;
}
},{"./identity":20,"./map":27,"./promise":35,"./register":38,"as-array":48}],11:[function(require,module,exports){
var asArray = require('as-array');
var register = require('./register');
var promise = require('./promise');
var all = require('./all');

var each = register('each', function (handler, promises) {
  return all(asArray(promises).map(function (value, idx) {
    return handler(promise(value), idx);
  }));
});

each.series = register('eachSeries', function (handler, promises) {
  var currentPromise = promise(true);
  var p = asArray(promises).map(function (value, idx) {
    return currentPromise = currentPromise.then(function () {
      return handler(promise(value), idx);
    });
  });
    
  return all(p);
});

module.exports = each;
},{"./all":3,"./promise":35,"./register":38,"as-array":48}],12:[function(require,module,exports){
var register = require('./register');

module.exports = register.operateOnValues(function (a, b) {
  return a === b;
});
},{"./register":38}],13:[function(require,module,exports){
var compact = require('./compact');
var promise = require('./promise');

module.exports = function (promises) {
  return compact(promises).then(function (compacted) {
    return promise(promises.length === compacted.length);
  });
};
},{"./compact":7,"./promise":35}],14:[function(require,module,exports){
var extend = require('extend');
var asArray = require('as-array');
var register = require('./register');
var identity = require('./identity');
var map = require('./map');
var promise = require('./promise');

module.exports = register('extend', function () {
  return map(identity, asArray(arguments))
    .then(function (objects) {
      return promise(extend.apply(null, objects));
    });
}, {
  parital: false
});
},{"./identity":20,"./map":27,"./promise":35,"./register":38,"as-array":48,"extend":51}],15:[function(require,module,exports){
var register = require('./register');
var each = require('./each');
var all = require('./all');

var filter = register('filter', buildFilter(each));
filter.series = register('filterSeries', buildFilter(each.series));


function buildFilter (_each) {
  return function (handler, promises) {
    var filtered = [];
    
    return _each(function (promise, idx) {
      return handler(promise, idx).then(function (passed) {
        if (passed) filtered.push(promise);
      });
    }, promises).then(function () {
      return all(filtered);
    });
  };
}

module.exports = filter;
},{"./all":3,"./each":11,"./register":38}],16:[function(require,module,exports){
var register = require('./register');
var each = require('./each');
var promise = require('./promise');

var find = register('find', buildFind(each));
find.series = register('findSeries', buildFind(each.series));

function buildFind (_each) {
  return function (handler, promises) {
    var wanted;
    
    return _each(function (value, idx) {
      return handler(value, idx).then(function (passed) {
        
        // FIXME: this leaves some promises hanging
        // when no values match
        
        if (passed && !wanted) wanted = value;
      });
    }, promises).then(function () {
      return promise(wanted);
    });
  };
}

module.exports = find;
},{"./each":11,"./promise":35,"./register":38}],17:[function(require,module,exports){
var register = require('./register');
var promise = require('./promise');
var find = require('./find');

module.exports = register('where', function (matchers, promises) {
  var keys = Object.keys(matchers);
  
  return find.series(function (value) {
    return value.then(function (obj) {
      var matching = false;
      
      keys.forEach(function (key) {
        if (obj[key] === matchers[key]) matching = true;
      });
      
      return promise(matching);
    });
  }, promises);
});
},{"./find":16,"./promise":35,"./register":38}],18:[function(require,module,exports){
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
},{"./promise":35,"as-array":48}],19:[function(require,module,exports){
var register = require('./register');

module.exports = register.operateOnValues(function (a, b) {
  return a < b;
});
},{"./register":38}],20:[function(require,module,exports){
var promise = require('./promise');

module.exports = function () {
  return promise(arguments[0]);
};
},{"./promise":35}],21:[function(require,module,exports){
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
},{"./all":3,"./first":18,"./promise":35,"as-array":48}],22:[function(require,module,exports){
var promise = require('./promise');
var bln = require('./boolean');

module.exports = function (value) {
  return promise(value)
    .then(bln)
    .then(function (val) {
      return promise(!val);
    });
};
},{"./boolean":6,"./promise":35}],23:[function(require,module,exports){
var promise = require('./promise');
var first = require('./first');

module.exports = function (value) {
  return promise(first(value).then(Object.keys));
};
},{"./first":18,"./promise":35}],24:[function(require,module,exports){
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
},{"./first":18,"./promise":35,"as-array":48}],25:[function(require,module,exports){
var register = require('./register');

module.exports = register.operateOnValues(function (a, b) {
  return a > b;
});
},{"./register":38}],26:[function(require,module,exports){
var promise = require('./promise');

module.exports = function (value) {
  return value.then(function (val) {
    console.log(val);
    return promise(val);
  });
};
},{"./promise":35}],27:[function(require,module,exports){
var register = require('./register');
var each = require('./each');
var all = require('./all');

var map = register('map', buildMap(each));
map.series = register('mapSeries', buildMap(each.series));

function buildMap (_each) {
  return function (handler, promises) {
    var mapped = [];
    
    return _each(function (promise, idx) {
      return handler(promise, idx).then(mapped.push.bind(mapped));
    }, promises).then(function () {
      return all(mapped);
    });
  };
}

module.exports = map;
},{"./all":3,"./each":11,"./register":38}],28:[function(require,module,exports){
var all = require('./all');
var promise = require('./promise');

module.exports = function (promises) {
  return all(promises).then(function (values) {
    return promise(Math.max.apply(Math, values));
  });
};
},{"./all":3,"./promise":35}],29:[function(require,module,exports){
var all = require('./all');
var promise = require('./promise');

module.exports = function (promises) {
  return all(promises).then(function (values) {
    return promise(Math.min.apply(Math, values));
  });
};
},{"./all":3,"./promise":35}],30:[function(require,module,exports){
var register = require('./register');
var all = require('./all');
var pick = require('./pick');
var contains = require('./contains');
var reject = require('./reject');

module.exports = register('omit', function (keys, promise) {
  return all(promise, all(keys)).then(function (results) {
    var obj = results[0];
    var keysToRemove = results[1];
      
    var keys = reject(function (key) {
      return contains(key, keysToRemove);
    }, Object.keys(obj));
    
    return pick(keys, obj);
  });
});

},{"./all":3,"./contains":9,"./pick":32,"./register":38,"./reject":39}],31:[function(require,module,exports){
var asArray = require('as-array');

module.exports = function () {
  var partialArgs = asArray(arguments);
  var fn = partialArgs.shift();
  
  return function () {
    var appliedArgs = asArray(arguments);
    return fn.apply(null, partialArgs.concat(appliedArgs));
  };
};
},{"as-array":48}],32:[function(require,module,exports){
var register = require('./register');
var all = require('./all');
var promise = require('./promise');

module.exports = register('pick', function (keys, value) {
  var returnObj = {};
  
  return all(value, all(keys)).then(function (results) {
    var obj = results[0];
    var resolvedKeys = results[1];
    
    resolvedKeys.forEach(function (key) {
      returnObj[key] = obj[key];
    });
    
    return promise(returnObj);
  });
});
},{"./all":3,"./promise":35,"./register":38}],33:[function(require,module,exports){
var register = require('./register');
var all = require('./all');
var promise = require('./promise');

module.exports = register('pluck', function (key, promises) {
  return all(promises).then(function (res) {
    return promise(res.map(function (obj) {
      return obj[key];
    }));
  });
});
},{"./all":3,"./promise":35,"./register":38}],34:[function(require,module,exports){
var register = require('./register');
var first = require('./first');
var promise = require('./promise');

module.exports = register('prepend', function (stringToPrepend, value) {
  return first(value).then(function (val) {
    return promise('' + stringToPrepend + val + '');
  });
});
},{"./first":18,"./promise":35,"./register":38}],35:[function(require,module,exports){
var Promise = require('promise');

module.exports = function (value) {
  if (typeof value === 'function') return new Promise(value);
  return Promise.from(value);
};
},{"promise":53}],36:[function(require,module,exports){
var register = require('./register');
var asArray = require('as-array');
var each = require('./each');
var promise = require('./promise');

module.exports = register('reduce', function (handler, promises) {
  promises = asArray(promises);
  
  var accum = promises.shift();
  
  return each.series(function (value, idx) {
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
},{"./each":11,"./promise":35,"./register":38,"as-array":48}],37:[function(require,module,exports){
var asArray = require('as-array');
var register = require('./register');
var reduce = require('./reduce');

module.exports = register('reduceRight', function (handler, promises) {
  return reduce(handler, asArray(promises).reverse());
});
},{"./reduce":36,"./register":38,"as-array":48}],38:[function(require,module,exports){
var asArray = require('as-array');
var partial = require('./partial');
var all = require('./all');
var promise = require('./promise');

// Main method to create new, partialized methods
var register = function (name, fn, options) {
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

register.operateOnValues = function(operation) {
  return register('op', function (value1, value2) {
    return all(value1, value2).then(function (values) {
      return promise(operation(values[0], values[1]));
    });
  });
};

module.exports = register;
},{"./all":3,"./partial":31,"./promise":35,"as-array":48}],39:[function(require,module,exports){
var register = require('./register');
var filter = require('./filter');
var inverseBoolean = require('./inverse_boolean');

var reject = register('reject', buildReject(filter));
reject.series = register('rejectSeries', buildReject(filter.series));

function buildReject (_filter) {
  return function (handler, promises) {
    return _filter(function (promise, idx) {
      return handler(promise, idx)
        .then(inverseBoolean);
    }, promises);
  };
}

module.exports = reject;
},{"./filter":15,"./inverse_boolean":22,"./register":38}],40:[function(require,module,exports){
var asArray = require('as-array');
var promise = require('./promise');
var first = require('./first');
var all = require('./all');

var reverse = function (promises) {
  return all(promises.reverse());
};

reverse.values = function (value) {
  return first(value).then(function (arr) {
    return promise(arr.reverse());
  });
};

module.exports = reverse;
},{"./all":3,"./first":18,"./promise":35,"as-array":48}],41:[function(require,module,exports){
var find = require('./find');
var bln = require('./boolean');

module.exports = function (promises) {
  return find(bln, promises).then(bln);
};
},{"./boolean":6,"./find":16}],42:[function(require,module,exports){
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
},{"./map":27,"./promise":35,"./register":38}],43:[function(require,module,exports){
var register = require('./register');

module.exports = register.operateOnValues(function (a, b) {
  return b - a;
});
},{"./register":38}],44:[function(require,module,exports){
var asArray = require('as-array');
var first = require('./first');
var all = require('./all');
var promise = require('./promise');

var tail = function (promises) {
  return all(promises.slice(1));
};

tail.values = function (value) {
  return first(value).then(function (arr) {
    arr = asArray(arr);
    return promise(arr.slice(1));
  });
};

module.exports = tail;
},{"./all":3,"./first":18,"./promise":35,"as-array":48}],45:[function(require,module,exports){
var promise = require('./promise');
var first = require('./first');

module.exports = function (value) {
  return first(value)
    .then(function (obj) {
      var values = Object.keys(obj).map(function (key) {
        return obj[key];
      });
    
      return promise(values);
    });
};
},{"./first":18,"./promise":35}],46:[function(require,module,exports){
var register = require('./register');
var promise = require('./promise');
var filter = require('./filter');

module.exports = register('where', function (matchers, promises) {
  var keys = Object.keys(matchers);
  
  return filter(function (value) {
    return value.then(function (obj) {
      var matching = false;
      
      keys.forEach(function (key) {
        if (obj[key] === matchers[key]) matching = true;
      });
      
      return promise(matching);
    });
  }, promises);
});
},{"./filter":15,"./promise":35,"./register":38}],47:[function(require,module,exports){
var zipObject = require('zip-object');
var register = require('./register');
var promise = require('./promise');
var all = require('./all');

module.exports = register('zipObject', function (arr1, arr2) {
  return all(arr1, arr2)
    .then(function (values) {
      return promise(zipObject.apply(null, values));
    });
}, {
  partial: false
});
},{"./all":3,"./promise":35,"./register":38,"zip-object":55}],48:[function(require,module,exports){
var isArgs = require('lodash.isarguments');

module.exports = function (data) {
  if (!data) data = [];
  if (isArgs(data)) data = [].splice.call(data, 0);
  
  return Array.isArray(data)
    ? data
    : [data];
};
},{"lodash.isarguments":49}],49:[function(require,module,exports){
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

},{}],50:[function(require,module,exports){
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

},{}],51:[function(require,module,exports){
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

},{}],52:[function(require,module,exports){
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

},{"asap":54}],53:[function(require,module,exports){
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

},{"./core.js":52,"asap":54}],54:[function(require,module,exports){
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
},{"/Users/scott/www/modules/lag/node_modules/browserify/node_modules/insert-module-globals/node_modules/process/browser.js":50}],55:[function(require,module,exports){
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