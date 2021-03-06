var assert = require('assert');
var fs = require('fs');
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
				autoUpdate: true,
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
					],
					'animal-friends.csv': [
						'key'
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

	it('Can convert a CSV string data to an object', function (done) {
		
		var fs = require('fs');
		fs.readFile('./test/data/map.csv', 'utf8', function (error, data) {
			assert.equal(error, undefined);
			var obj = staticdata.csvToObj(data);
			assert.equal(obj[0].name, 'US');
			assert.equal(obj[0].value, 'United States of America,US,USA');
			assert.equal(obj[0].id, 1);
			assert.equal(obj[0].code, 100);
			assert.equal(obj[0].key, true);
			assert.equal(obj[0].desc, 'lalala');
			assert.equal(obj[3].name, 'CN');
			assert.equal(obj[3].value, '中國');
			assert.equal(obj[3].id, 4);
			assert.equal(obj[3].code, 400);
			assert.equal(obj[3].key, false);
			assert.equal(obj[3].desc, 5454544);
			done();
		});

	});

	it('Can convert a multi-demensional array to a CSV string', function () {
		var test = [
			{ id: 1, name: 'foo', value: 100 },
			{ id: 2, name: 'boo', value: 200 },
			{ id: 3, name: 'hello world', standard: true },
			{ id: 4, name: 'no more', standard: false, value: 0 }
		];
		var csv = staticdata.arrayToCsv(test);
		var result = 'id,name,value,standard\n';
		result += '1,"foo",100,\n';
		result += '2,"boo",200,\n';
		result += '3,"hello world",,true\n';
		result += '4,"no more",0,false';
		assert.equal(csv, result);
	});

	it('Can inflate w/ data that matches multiple rows', function () {
		var a = staticdata.create('animals');
		var af = staticdata.create('animal-friends');
		var success = a.inflate(af, 'friends', 'key');
		var first = a.getAll()[0];
		assert(first);
		assert.equal(first.friends[0].key, 'x1');
		assert.equal(first.friends[1].key, 'x1');
	});

	it('Can auto-update on file change', function (done) {
		var before = staticdata.create('auto').getAll();
		assert.equal(before[0].id, 0);		
		assert.equal(before[0].value, 'zero');
		fs.writeFile('./test/data/auto.csv', 'id,value\n0,\"zero\"\n1,\"one\"', function (error) {
			assert.equal(error, undefined);
			setTimeout(function () {
				var after = staticdata.create('auto').getAll();
				assert.equal(after[0].id, 0);		
				assert.equal(after[0].value, 'zero');
				assert.equal(after[1].id, 1);		
				assert.equal(after[1].value, 'one');
				fs.writeFile('./test/data/auto.csv', 'id,value\n0,\"zero\"', function (error) {
					assert.equal(error, undefined);
					setTimeout(function () {
						done();
					}, 100);
				});
			}, 100);
		});
	});

});
