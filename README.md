# Staticdata Module

A module to convert CSV file data into JSON object and provides structured methods to access the converted data.

## How to install

`npm install`

## How to include it in my project

#### To add this package as a dependency of your application, add the following to your `package.json`:

```json
{
	"staticdata": ">= 0.0.1"
}
```

#### To use this module in your application, add the code similar to the follwoing:

```javascript
var sd = require('staticdata');
var configObject = {
	path: '/path/to/my/staticdata/directory/'
};
sd.setup(configObject, function (error) {
	if (error) {
		// oops...
	}
	// now staticdata module is ready
});
```

## Configurations

The module supports both CSV and JSON formatted files as resource data files.

With the configuration object passed to `.setup()`, you can modify the behavior of `staticdata` module.

```javascript
{
	path: '/path/to/your/data/directory/',
	delimiter: '<optional>', // supported delimiters are: , ^ | ; \t
	index: {
		// optional object to index converted data. for .getOneByIndex. .getManByIndex, and .getAllByIndexName
	},
	mapOpenFile: <optional>, // an integer to indicate how many files are allowed to stay open while converting the data. Default is 100.
}
```

## CSV

#### Supported CSV Delimiters

`staticdata` module supports the following delimiters in CSV file format:

* Comma (,)
* Tab (\t)
* Semicolon (;)
* Caret (^)
* Vertical bar (|)

**NOTE:** Default delimiter used is `,`.

#### Escaping Characters

If your CSV file contains the same characters as the delimiter, the characters must be escaped with a backslash (\\).

Example with delimtier `,`:

```
id,name,age
100,"Marley, Bob",33
101,"Harper, Ben",45
```

***

## API

####.create

Returns an instance of StaticData class.

You will be accessing the data from this instance.

```
StaticData create(String name)
```

Example:

```javascript
/*
in order to create a static data object from a static data file called "example.csv", do the following:
*/
var staticdata = require('staticdata');
example = staticdata.create('example');
```

Example With Subdirectory:

```javascript
// to create a static data object from a static data file that is located in /test/another/myfile.csv, do the following:
var staitcdata = require('staticdata');
var myfile = staticdata.create('test/another/myfile');
```

####.csvToObj

Parses CSV data into an object.

```
Object csvToObj(String csvData);
```

***

## StaticData Class

### Methods

#### .getOne

Returns matched data by the CSV row index.

The second argument is an option. If given, the values of the given column only will be returned.

```
Object getOne(Integer index, [*Array propertiees])
```

#### .getMany

Returns a list of matched data by the CSV row indexes.

```
Array getMany(Array indexList, [*Array properties])
```

#### .getAll

Returns an array of all data

```
Array getAll([*Array properties])
```

#### .getOneByIndex

Returns a match data by the pre-indexed index key.

In order to make a use of this method, the data **MUST** be `indexed`.

For more details, please read configurations section above.

```
Object getOneByIndex(String indexName, String indexKey, [*Array properties])
```

Example:

```javascript
var sd = require('staticdata');
var config = {
	path: '/path/to/my/data/',
	index: {
		'sub/example.csv': [
			'id'
		]
	}
};
sd.setup(config, function (error) {
	if (error) {
		// oops...
	}
	var example = sd.create('sub/example');
	var data = example.getOneByIndex('id', 'item001');
});
```

#### .getManyByIndex

Returns an object of matched data.

```
Object getManyByIndex(String indexName, Array indexKeyList, [*Array properties])
```

Example:

```javascript
var sd = require('staticdata');
var config = {
	path: '/path/to/my/data/',
	index: {
		'sub/example.csv': [
			'id'
		]
	}
};
sd.setup(config, function (error) {
	if (error) {
		// oops...
	}
	var example = sd.create('sub/example');
	var data = example.getManyByIndex('id', ['item001', 'item002', 'item003']);
	console.log(data.item001, data.item002, data.item003);
});
```

#### .getAllByIndexName

Returns an indexed object of all data

```
Object getAllByIndexName(String indexName, [*Array properties])
```

####.inflate

```
Void inflate(StaticData parentStaticData, String parentKey, String childKey)
```

Combines 2 staticdata objects on `parentKey` and `childKey`.

`parentKey` is the column from source staticdata and `childKey` is the column from the staticdata given to the function.

**NOTE:** The child staticdata MUST be indexed by `childKey`.

Example:

```javascript
/* CSV data of men.csv:
name,wife
"Bob",1
"Kevin",2
"Nathan",3

converted to:
[
	{ "name": "Bob", "wife": 1 },
	{ "name": "Kevin", "wife": 2 },
	{ "name": "Nathan", "wife": 3 },
]
CSV data of women.csv:
id,name
1,"Sandy"
2,"Olivia"
3,"Jess"

converted to:
[
	{ "id": 1, "name": "Sandy" },
	{ "id": 2, "name": "Olivia" },
	{ "id": 3, "name": "Jess" },
]
*/
// inflate the two files:
var sd = require('staticdata');
var config = {
	path: '/path/to/my/data/',
	index: {
		'women.csv': [
			'id'
		]
	}
};
sd.setup(config, function (error) {
	if (error) {
		// hmmmm
	}
	var men = sd.create('men');
	var women = sd.create('women');
	men.inflate(women, 'wife', 'id');
	/*
	Resulting data
	[
	    {
		"name": "Bob",
		"wife": {
		    "id": 1,
		    "Sandy"
		}
	    },
	    {
		"name": "Kevin",
		"wife": {
		    "id": 2,
		    "Olivia"
		}
	    },
	    {
		"name": "Nathan",
		"wife": {
		    "id": 3,
		    "Jess"
		}
	    }
	]
	*/
});
```
