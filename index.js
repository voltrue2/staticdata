/**
 * configurations
 *
 * {
 *	"path": "directory path to the source static files",
 *	"delimiter": optional,
 *	"qoute": optional,
 *	"index": optional {
 *		"staticFileName": ["indexName"...] > this must be a cloumn name in the file
 *	}
 * }
 *
 * */

var fs = require('fs');
var async = require('async');
var csv = require('./lib/csv');
var parser = require('./lib/parser');
var helpers = require('./lib/helpers');
var StaticData = require('./lib/staticdata');

// maximum number of files to be opened and read at once on setup
var maxOpenFiles = 100;
var config;
var delimiter = ',';
var quote = '"';
var staticData = {}; // static data source object
var sdMap = {}; // static data object map

exports.setup = function (configIn, cb) {
	if (!configIn || !configIn.path) {
		return cb(new Error('invalid configuration: \n' + JSON.stringify(configIn, null, 4)));
	}
	config = configIn;
	// optional
	if (config.delimiter !== undefined) {
		delimiter = config.delimiter;
	}
	if (config.quote !== undefined) {
		quote = config.quote;
	}
	if (config.maxOpenFiles > 0) {
		maxOpenFiles = config.maxOpenFiles;
	}
	// set up CSV parser
	csv.setup(delimiter);
	// start parsing files
	helpers.walkDir(config.path, function (error, list) {
		if (error) {
			return cb(error);
		}
		async.eachLimit(list, maxOpenFiles, function (item, nextCallback) {
			readFile(item.file, nextCallback);
		}, cb);
	});
};

/*
* dataName rule:
* configuration path: staticdata/
* example: staticdata/example/test.csv = example/test
*/
exports.create = function (dataName) {
	
	// check for existing static data object first
	if (sdMap[dataName]) {
		return sdMap[dataName];
	}	

	// create a new static data object
	if (staticData[dataName]) {
		var sd = new StaticData(dataName, staticData[dataName]);
		sdMap[dataName] = sd;
		return sd;
	}
	return null;
};

exports.csvToObj = function (csvData) {
	return toObject('', csvData);
};

exports.arrayToCsv = function (list) {
	return toCsv(list);
};

function readFile(path, cb) {
	var lastDot = path.lastIndexOf('.');
	var type = path.substring(lastDot + 1);
	var name = path.substring(path.lastIndexOf(config.path) + config.path.length, lastDot);
	fs.readFile(path, 'utf8', function (error, data) {
		if (error) {
			return cb(error);
		}
		switch (type) {
			case 'csv':
				data = toObject(path, data);
				break;
			case 'json':
				try {
					data = JSON.parse(data);
				} catch (e) {
					return cb(e);
				}
				break;
			default:
				data = { data: data };
				break;
			
		}
		
		// check for error
		if (data instanceof Error) {
			return cb(data);
		}
		
		// create index map(s) if asked
		var indexMap = null;
		var fileName = name + '.' + type;
		if (config.index && config.index[fileName]) {
			indexMap = mapIndex(data, config.index[fileName]);
		}	
		
		// add it to cache
		staticData[name] = { data: data, indexMap: indexMap, path: path };
		
		cb();
	});
}

function toObject(file, data) {
	var parsed = csv.parse(file, data);
	var obj = parser.toObject(parsed.file, parsed.data);
	return obj;
}

function toCsv(list) {
	var columns = [];
	// create columns
	for (var i = 0, len = list.length; i < len; i++) {
		var item = list[i];
		if (typeof item === 'object') {
			for (var key in item) {
				if (columns.indexOf(key) === -1) {
					columns.push(key);
				}
			}
		}
	}
	// create a CSV array
	var csv = [];
	var clen = columns.length;
	// inject columns first
	csv.push(columns.join(delimiter));
	// now inject the values
	for (var j = 0, jen = list.length; j < jen; j++) {
		var row = list[j];
		var values = [];
		for (var c = 0; c < clen; c++) {
			if (row[columns[c]] === undefined) {
				values.push(''); 
			} else {
				var value = row[columns[c]];
				if (typeof value === 'string') {
					value = quote + value + quote;
				}
				values.push(value);
			}
		}
		csv.push(values.join(delimiter));
	}
	return csv.join('\n');
}

function mapIndex(data, indexNames) {
	var map = {};
	for (var c = 0, length = data.length; c < length; c++) {
		var item = data[c];
		for (var i = 0, len = indexNames.length; i < len; i++) {
			var indexName = indexNames[i];
			if (item[indexName] !== undefined) {
				if (!map[indexName]) {
					map[indexName] = {};
				}
				var index = item[indexName];
				if (map[indexName][index]) {
					// index is not unique
					if (!Array.isArray(map[indexName][index])) {
						map[indexName][index] = [map[indexName][index]];
					}
					map[indexName][index].push(item);
				} else {
					// index is unique or this is the first item of the index
					map[indexName][index] = item;
				}
			}
		}
	}
	return map;
}
