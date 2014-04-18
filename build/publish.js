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
    
    // Get source name for aliased method
    if (lag[name]._aliased) {
      var alias = name;
      name = lag[name]._sourceName;
    }
    
    mkdirp.sync(pathname);
    
    var contents = generateModuleFile(pathname, name, alias);
    generatePackage(pathname, lowercaseName, dependencies(contents), alias);
    generateReadme(pathname, lowercaseName, alias);
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
    else console.log('\n\nSUCCESS:', moduleNum, 'modules published');
  });
});


function generateModuleFile (pathname, name, alias) {
  var originalFilepath = path.resolve(__dirname, '../lib', unCamelCase(name) + '.js');    
  var fileContents = fs.readFileSync(originalFilepath).toString();
  var contents = fileContents.replace(REQUIRE_MATCH, function (s,t) {
    return s.replace("require('./", "require('lag.")
  });
  fs.writeFileSync(pathname + '/index.js', contents);
  return contents;
}

function generatePackage (pathname, name, deps, alias) {
  var packageName = alias || name;
  
  fs.writeFileSync(pathname + '/package.json', JSON.stringify({
    "name": "lag." + packageName,
    "version": pkg.version,
    "description": "The lag function " + packageName + "() as a standalone module.",
    "main": "index.js",
    "repository": pkg.repository,
    "keywords": pkg.keywords.concat(packageName),
    "author": pkg.author,
    "license": pkg.license,
    "bugs": pkg.bugs,
    "homepage": pkg.homepage,
    "dependencies": deps, // dynamically create this
  }, null, 2));
}

function generateReadme (pathname, name, alias) {
  var packageName = alias || name;
  
  var readmeContents = [
    '# lag.' + packageName,
    '',
    pkg.description + ' **v' + pkg.version + '**',
    '',
    'The [lag](https://github.com/scottcorgan/lag) function **' + packageName + '()** as a standalone module.',
    '',
    '## Install',
    '',
    '```',
    'npm install lag.' + packageName + ' --save',
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