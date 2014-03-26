#!/usr/bin/env node

var lag = require('../index');
var npm = require('npm');
var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');
var async = require('async');
var detective = require('detective');
var remove = require('remove');
var pkg = require('../package.json');
var REQUIRE_MATCH = /require.*\((.*['"]\..*)\)/gi;
var buildDir = path.resolve(__dirname, '../.tmp');

// Remove current build tmp directory
if (fs.existsSync(buildDir)) remove.removeSync(buildDir);

// Build each module
Object
  .keys(lag)
  .forEach(function (name) {
    var lowercaseName = name.toLowerCase();
    var pathname = path.join(buildDir, lowercaseName)
    
    mkdirp.sync(pathname);
    
    var contents = generateModuleFile(pathname, name);
    generatePackage(pathname, lowercaseName, dependencies(contents));
    generateReadme(pathname, lowercaseName);
  });

// Publish modules to NPM
var moduleNum = 0;
npm.load({
  loaded: false
}, function (err) {
  async.each(Object.keys(lag), function (name, cb) {
    var lowercaseName = name.toLowerCase();
    var modulePath = path.resolve(__dirname, '../.tmp/' + lowercaseName);
    
    npm.commands.publish([modulePath], function (err) {
      if (!err) console.log('lag.' + lowercaseName + ' published!');
      if (!err) moduleNum += 1;
      cb(err);
    });
  }, function (err) {
    if (err) console.error('ERROR:', err);
    else console.log('SUCCESS:', moduleNum, 'modules published');
  });
});


function generateModuleFile (pathname, name) {
  var originalFilepath = path.resolve(__dirname, '../lib', unCamelCase(name) + '.js');    
  var fileContents = fs.readFileSync(originalFilepath).toString();
  var contents = fileContents.replace(REQUIRE_MATCH, function (s,t) {
    return s.replace("require('./", "require('lag.")
  });
  fs.writeFileSync(pathname + '/index.js', contents);
  return contents
}

function generatePackage (pathname, name, deps) {
  fs.writeFileSync(pathname + '/package.json', JSON.stringify({
    "name": "lag." + name,
    "version": pkg.version,
    "description": "Functionally promises. Very functional.", // TODO: make this custom
    "main": "index.js",
    "repository": pkg.repository,
    "keywords": pkg.keywords.concat(name),
    "author": pkg.author,
    "license": pkg.license,
    "bugs": pkg.bugs,
    "homepage": pkg.homepage,
    "dependencies": deps, // dynamically create this
  }, null, 2));
}

function generateReadme (pathname, name) {
  var readmeContents = [
    '# lag.' + name,
    '',
    pkg.description + ' **v' + pkg.version + '**',
    '',
    'The [lag](https://github.com/scottcorgan/lag) function **' + name + '()** as a standalone module.',
    '',
    '## Install',
    '',
    '```',
    'npm install lag.' + name + ' --save',
    '```'
  ].join('\n');
  fs.writeFileSync(pathname + '/README.md', readmeContents);
}

function dependencies (fileContent) {
  var deps = {};
  var requires = detective(fileContent).map(function (req) {
    var dep = {
      name: req,
      version: pkg.dependencies[req]
    };
    
    // Use the current module version
    if (req.indexOf('lag.') > - 1) dep.version = pkg.version;
    
    return dep;
  }).forEach(function (dep) {
    deps[dep.name] = dep.version;
  });
  
  return deps
}

function unCamelCase(str) {
  return str.replace(/([a-z])([A-Z])/, "$1_$2").toLowerCase();
}