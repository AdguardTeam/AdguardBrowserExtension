exports.Prefs = {};

var assertNotNull = function (value) {
	if (!value) {
		throw new Error('Value is null');
	}
};

var assertEquals = function (actual, expected) {
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
	for (var i = 0; i < tests.length; i++) {
		var testName = _getTestName(i);

		try {
			var startTime = new Date().getTime();
			_logDebug(testName + ': Start');
			tests[i]();
			_logDebug(testName + ': Finish. Elapsed: ' + (new Date().getTime() - startTime) + 'ms');
		} catch (ex) {
			_logDebug(testName + ': Error. Elapsed: ' + (new Date().getTime() - startTime) + 'ms');
			console.error(ex);
		}
	}
	console.info('Tests passed: ' + tests.length);
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
