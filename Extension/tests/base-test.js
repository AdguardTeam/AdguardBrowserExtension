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
		try {
			tests[i]();
		} catch (ex) {
			console.log(ex.stack);
			return;
		}
	}
	console.info('Tests passed: ' + tests.length);
};
