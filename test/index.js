var assert = require('assert');
var staticdata = require('../');
var names = [
	'US',
	'JA',
	'RU',
	'CN'
];

describe('staticdata module unit test', function () {
	
	it('Can set up staticdata module', function (done) {
	
		var config = {
				path: 'test/data/',
				index: {
					'map.csv': [
						'name'
					],
					'sample.csv': [
						'level'
					],
					'parent.csv': [
						'name'
					],
					'child.csv': [
						'size'
					],
					'tab.csv': [
						'id'
					]
				}
		};

		staticdata.setup(config, function (error) {
			assert.equal(error, undefined);
			done();
		});

	});

	it('Can get a second element from an array made from a CSV file', function () {
		
		var map = staticdata.create('map');
		var japan = map.getOne(1);
		
		assert.equal(japan.value, '日本');

	});

	it('Can get all elements from an array made from a CSV file', function () {

		var map = staticdata.create('map');
		var list = map.getAll();

		for (var i = 0, len = list.length; i < len; i++) {
			assert.equal(list[i].name, names[i]);
		}

	});

	it('Can get a data object by indexed column from a CSV file', function () {
		
		var map = staticdata.create('map');
		var usa = map.getOneByIndex('name', 'US');

		assert.equal(usa.value, 'United States of America,US,USA');
	
	});

	it('Can get all data objects by indexed column from a CSV file', function () {
		
		var i = 0;
		var map = staticdata.create('map');
		var maps = map.getAllByIndexName('name');

		for (var name in maps) {
			assert.equal(name, names[i]);
			i++;
		}

	});

	it('Does not throw an exception when accessing none-indexed map data', function () {
		
		var map = staticdata.create('map');
		var maps = map.getAllByIndexName('dummy');
		
		assert.equal(maps, null);

	});

	it('Can get value property only', function () {
		
		var map = staticdata.create('map');
		var list = map.getAll(['value']);
		
		for (var i = 0, len = list.length; i < len; i++) {
			assert(list[i].value);
			assert.equal(list[i].name, undefined);
		}

	});

	it('Can remove BOM (byte order mark) from CSV files', function () {
	
		var map = staticdata.create('sample');
		var data = map.getOneByIndex('level', 1);
	
		assert(data);
	
	});

	it('Can inflate a staticdata object with another', function () {
	
		var parent = staticdata.create('parent');
		var child = staticdata.create('child');
		var success = parent.inflate(child, 'size', 'size');
		var bob = parent.getOneByIndex('name', 'Bob');
		
		assert.equal(success, true);
		assert.equal(bob.name, 'Bob');
		assert.equal(bob.size.size, 10);
		assert.equal(bob.size.name, 'Regular');
		assert.equal(bob.size.id, 3);
	
	});

	it('Can fail to inflate staticdata object with none-indexed child staticdata', function () {
		
		var sample = staticdata.create('sample');
		var tab = staticdata.create('tab');
		
		try {
			sample.inflate(tab, 'id', 'id');
		} catch (error) {
			assert.equal(error.message, 'failed to inflate staticdata [sample]: child staticdata [tab] MUST be index by "id"');
		}

	});

});
