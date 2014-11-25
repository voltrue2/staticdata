var helpers = require('./helpers');

module.exports = StaticData;

function StaticData(name, src) {
	this._name = name;
	this._src = src.data;
	this._indexMap = src.indexMap || {};
}

StaticData.prototype.update = function (src) {
	this._src = src.data;
	this._indexMap = src.indexMap || {};
};

// create multi-dimensional object with another staticdata
// child staticdata MUST be indexed by childKey
StaticData.prototype.inflate = function (childStaticdata, parentKey, childKey) {
	var success = false;
	// check to see if the child staticdata has been indexed by childKey or not
	if (!childStaticdata._indexMap[childKey]) {
		throw new Error('failed to inflate staticdata [' + this._name + ']: child staticdata [' + childStaticdata._name + '] MUST be index by "' + childKey + '"');
	}
	// now inflate the staticdata with childStaticdata
	for (var i = 0, len = this._src.length; i < len; i++) {
		var srcItem = this._src[i];
		var child = childStaticdata.getOneByIndex(childKey, srcItem[parentKey]);
		if (child) {
			srcItem[parentKey] = child;
			if (!success) {
				success = true;
			}
		}
	}
	return success;
};

StaticData.prototype.getOneByIndex = function (indexName, key, props) {
	if (!this._indexMap) {
		return null;
	}
	var data = this._indexMap[indexName] || null;
	if (!data || data[key] === undefined) {
		return null;
	}

	var res = data[key];

	if (typeof res === 'object') {
		return helpers.cloneObj(res, props);
	}

	return res;
};

StaticData.prototype.getManyByIndex = function (indexName, keyList, props) {
	var res = {};
	for (var i = 0, len = keyList.length; i < len; i++) {
		var key = keyList[i];
		res[key] = this.getOneByIndex(indexName, key, props);
	}	
	return res;
};

StaticData.prototype.getOne = function (index, props) {
	var data = this._src[index];
	if (data === undefined) {
		return null;
	}

	if (typeof data === 'object') {
		return helpers.cloneObj(data, props);		
	}
	
	return data;
};

StaticData.prototype.getMany = function (indexList, props) {
	var res = {};
	for (var i = 0, len = indexList.length; i < len; i++) {
		var key = indexList[i];
		res[key] = this.getOne(key, props);
	}

	return res;
};

StaticData.prototype.getAll = function (props) {
	return helpers.cloneObj(this._src, props);
};

StaticData.prototype.getAllByIndexName = function (indexName, props) {
	if (!this._indexMap || this._indexMap[indexName] === undefined) {
		return null;
	}

	return helpers.cloneObj(this._indexMap[indexName], props);
};
