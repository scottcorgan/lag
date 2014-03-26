#!/usr/bin/env node

var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');
var lag = require('../index');
var REQUIRE_MATCH = /require.*\((.*['"]\..*)\)/gi;
var pkg = require('../package.json');

Object
  .keys(lag)
  .forEach(function (name) {
    var pathname = path.resolve(__dirname, '../.tmp', name.toLowerCase())
    mkdirp.sync(pathname);
    
    // Generate file
    var originalFilepath = path.resolve(__dirname, '../lib', unCamelCase(name) + '.js');    
    var fileContents = fs.readFileSync(originalFilepath).toString();
    var contents = fileContents.replace(REQUIRE_MATCH, function (s,t) {
      
      // NOTE: need to track the dependencies so I can put
      // the list in the package.json
      
      return s.replace("require('./", "require('lag.")
    });
    fs.writeFileSync(pathname + '/index.js', contents);
    
    // Generate package.json
    fs.writeFileSync(pathname + '/package.json', JSON.stringify({
      "name": "lag." + name.toLowerCase(),
      "version": pkg.version,
      "description": "Functionally promises. Very functional.", // TODO: make this custom
      "main": "index.js",
      "repository": pkg.repository,
      "keywords": pkg.keywords,
      "author": pkg.author,
      "license": pkg.license,
      "bugs": pkg.bugs,
      "homepage": pkg.homepage,
      "dependecies": {}, // dynamically create this
    }, null, 2));
    
    // Generate README.md
    fs.writeFileSync(pathname + '/README.md', '# lag.' + name.toLowerCase() + '\n\n' + pkg.description);
    
  });
  
  
  function unCamelCase(str) {
    return str.replace(/([a-z])([A-Z])/, "$1_$2").toLowerCase();
  }