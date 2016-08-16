exports.Prefs = {};

var assertNotNull = function (value) {
	if (!value) {
		throw new Error('Value is null');
	}
};

var assertNotEmpty = function(value) {
	assertNotNull(value);
};

var assertEmpty = function (value) {
	if (value) {
		throw new Error('Value is not empty');
	}
};

var assertNull = function(value) {
	if (value !== null) {
		throw new Error(value + ' is not null');
	}
};

var assertEquals = function (expected, actual) {
	if (actual !== expected) {
		throw new Error(actual + ' !== ' + expected);
	}
};

var assertTrue = function (value) {
	if (!value) {
		throw new Error('Value is not true');
	}
};

var assertFalse = function (value) {
	if (value) {
		throw new Error('Value is not false');
	}
};

var tests = [];

var addTestCase = function (test) {
	tests.push(test);
};

var runTests = function () {
	var failed = [];
	var passed = [];
	for (var i = 0; i < tests.length; i++) {
		var testName = _getTestName(i);

		try {
			var startTime = new Date().getTime();
			_logDebug(testName + ': Start');
			tests[i]();
			_logDebug(testName + ': Finish. Elapsed: ' + (new Date().getTime() - startTime) + 'ms');
			passed.push(testName);
		} catch (ex) {
			_logDebug(testName + ': Error. Elapsed: ' + (new Date().getTime() - startTime) + 'ms');
			console.error(ex);
			failed.push(testName);
		}
	}
	console.info('Tests passed: ' + passed);
	console.info('Tests failed: ' + failed);
	var html = '<h2>Result</h2><p>Passed: ' + passed.length + '<br/>Failed: ' + failed.length + '</p>';
	if (failed.length) {
		html += '<h3>Failed tests</h3><p>';
		for (var i = 0; i < failed.length; i++) {
			html += failed[i] + '<br/>';
		}
		html += '</p>';
	}
	document.body.innerHTML = html;
};

var _logDebug = function(message) {
	var now = new Date();
	console.log(now.toISOString() + ' DEBUG ' + message);
};

var _getTestName = function(i) {
	try {
		var testFunction = tests[i];
		return testFunction.toString().match(/function ([a-zA-Z-_]+)/)[1];
	} catch (ex) {
		console.error('Cannot get test name ' + ex);
	}

	return 'Test #' + i;
};
