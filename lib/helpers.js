var fs = require('fs');

exports.walkDir = function (path, cb) {
	var res = [];
	var pending = 0;
	var eachWalk = function (error, results) {
		if (error) {
			return cb(error);
		}
		res = res.concat(results);
		pending--;
		if (!pending) {
			return cb(null, res);
		}
	};
	fs.lstat(path, function (error, stat) {
		if (error) {
			return cb(error);
		}
		if (!stat.isDirectory()) {
			res.push({ file: path, stat: stat });
			return cb(null, res);
		}
		fs.readdir(path, function (error, list) {
			if (error) {
				return cb(error);
			}
			pending += list.length;
			if (!pending) {
				return cb(null, res);
			}
			for (var i = 0, len = list.length; i < len; i++) {
				var file = list[i];
				var slash = path.substring(path.length - 1) !== '/' ? '/' : '';
				var filePath = path + slash + file;
				exports.walkDir(filePath, eachWalk);
			}
		});
	});
};

exports.typeCast = function (data) {
	if (isNaN(data)) {
		// none numeric data
		switch (data.toLowerCase()) {
			case 'undefined':
				return undefined;
			case 'null':
				return null;
			case 'true':
				return true;
			case 'false':
				return false;
		}
		try {
			// object
			return JSON.parse(data);
		} catch (e) {
			// string
			return data;
		}
	}
	// numerice data
	if (data.indexOf('.') !== -1) {
		return parseFloat(data);
	}
	return parseInt(data, 10);
};

exports.cloneObj = function (obj, props) {
	if (obj === null || typeof obj !== 'object') {
		return obj;
	}
	var res = null;
	if (Array.isArray(obj)) {
		res = [];
	} else {
		res = {};
	}
	for (var prop in obj) {
		if (isNaN(prop) && props && props.indexOf(prop) === -1) {
			continue;
		}
		if (obj[prop] !== null && typeof obj[prop] === 'object') {
			res[prop] = module.exports.cloneObj(obj[prop], props);
		} else {
			res[prop] = obj[prop];
		}
	}
	return res;
};
