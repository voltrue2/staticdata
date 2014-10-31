var delimiterEscapeMap = {
	'\t': '\\t',
	',': '\\,',
	'|': '\\|',
	';': '\\;',
	'^': '\\^'
};
var BOM = /^\uFEFF/g;
var delimiter;
var escaped;

exports.setup = function (delimiterIn) {
	delimiter = delimiterIn;
	escaped = delimiterEscapeMap[delimiter] || null;
	if (!escaped) {
		throw new Error('given delimiter is not supported: ' + delimiter);
	}
};

exports.parse = parse;

function parse(filePath, data) {
	// remove BOM from the file data
	data = data.replace(BOM, '');
	var list = [];
	var rows = separateRows(data);
	for (var i = 0, len = rows.length; i < len; i++) {
		var separated = separateColumns(rows[i]);
		if (separated.length) {
			list.push(separated);
		}	
	}
	return { file: filePath, data: list };
}

function separateRows(data) {
	// replace all linebreaks with \r to elimitnate OS dependent EOL issues
	data = data.replace(/(\r\r|\n)/gm, '\r');
	return data.split('\r');
}

function separateColumns(row) {
	// separated list of columns
	var columns = [];
	// copy of row to keep track of the current position
	// delimiter poisition
	var index = row.indexOf(delimiter);
	// remember the escaped column value to be pushed in later
	var escapedCol = '';
	// find and separate (if delimiter is escaped with \ ignore and skip)
	while (index !== -1) {
		// split
		var separated = row.substring(0, index + 1);
		// check for escape
		if (separated.indexOf(escaped) === -1) {
			// if there is escaped column value that needs to be pushed in, push it in now
			if (escapedCol !== '') {
				columns.push(typeCast(escapedCol + separated.substring(0, separated.length - 1)));
				// reset escaped
				escapedCol = '';
			} else {
				// delimiter is not escaped. we keep the separated item as a column value
				columns.push(typeCast(separated.substring(0, separated.length - 1)));
			}
		} else {
			// escaped delimiter detected. append it to escaped
			escapedCol += separated;
		}
		// update the current position
		row = row.replace(separated, '');
		index = row.indexOf(delimiter);
	}
	// check for the left over
	if (row !== '') {
		if (escapedCol !== '') {
			// both row and escapedCol
			columns.push(typeCast(escapedCol + row));
		} else {
			// row only
			columns.push(typeCast(row));
		}
	}
	return columns;
}

function typeCast(data) {
	// trim double quotes
	if (data.indexOf('"') === 0) {
		data = data.substring(1);
	}
	if (data.substring(data.length - 1) === '"') {
		data = data.substring(0, data.length - 1);
	}
	// cast type
	if (data && data.indexOf('0x') === -1 && !isNaN(data)) {
		// numeric data
		var intOrHexVal = parseInt(data, 10);
		var floatVal = parseFloat(data);
		if (floatVal && intOrHexVal !== floatVal) {
			return floatVal;
		} else {
			return intOrHexVal;
		}
	}
	// non numeric data
	switch (data.toLowerCase()) {
		case 'true':
			return true;
		case 'false':
			return false;
		case 'null':
			return null;
		case 'undefined':
			return undefined;
		default:
			try {
				return JSON.parse(data);
			} catch (e) {
				// remove unnecessary backslash
				while (data.indexOf(escaped) !== -1) {
					data = data.replace(escaped, delimiter);
				}
				return data;
			}
	}
}
