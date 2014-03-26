(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var fs = require('fs');
var modules = fs.readdirSync('./lib');
var lag = Object.create(null);

// Load all the modules
modules
  .map(removeExension)
  .map(loadModule)
  .forEach(extendLagWith);

function extendLagWith (mod) {
  lag[mod.name] = mod.handler;
}

function removeExension (filename) {
  return filename.replace('.js', '');
}

function loadModule (name) {
  return {
    name: camelCase(name),
    handler: require('./lib/' + name)
  };
}

function camelCase (name) {
  return name.split('_').map(function (part, idx) {
    if (idx === 0) return part;
    return part.charAt(0).toUpperCase() + part.slice(1);
  }).join('');
}

module.exports = lag;
},{"fs":2}],2:[function(require,module,exports){

},{}]},{},[1])