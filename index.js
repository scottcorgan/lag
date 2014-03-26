var fs = require('fs');
var modules = fs.readdirSync('./lib');
var lag = Object.create(null);

// Load all the modules
modules
  .map(removeExension)
  .map(loadModule)
  .forEach(function (mod) {
    lag[mod.name] = mod.handler;
  });

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