/* global assertNotEmpty */
/* global assertEmpty */
/* global URL_FILTER_REGEXP_START_URL */
/* global assertEquals */
/* global _logDebug */
/* global addTestCase */
/**
 * Test script for Safari content-blocking rules converter
 */

var Log = require('lib/utils/log').Log;
var SafariContentBlockerConverter = require('converter').SafariContentBlockerConverter;

// Setup test
var specials = [
    '.',
    '+',
    '?',
    '$',
    '{',
    '}',
    '(',
    ')',
    '[',
    ']',
    '\\',
    '/'
];

var regex = new RegExp('[' + specials.join('\\') + ']', 'g');
var escapeRegExp = function (str) {
    return str.replace(regex, "\\$&");
};

var rules = [
    '||pics.rbc.ru/js/swf',
    '||tardangro.com^$third-party',
    '||videoplaza.com^$~object-subrequest,third-party',
    '||videoplaza.tv^$object-subrequest,third-party,domain=tv4play.se',
    '||b.babylon.com^',
    '||getsecuredfiles.com^$popup,third-party',
    'popsugar.com###calendar_widget',
    '@@||emjcd.com^$image,domain=catalogfavoritesvip.com|freeshipping.com',
    '@@||intellitxt.com/ast/js/nbcuni/$script',
    '@@||hulu.com/embed$document',
    '@@||hulu.com/$document',
    '@@http://hulu.com^$document',
    '@@https://hulu.com$document',
    '@@www.any.gs$urlblock',
    '@@wfarm.yandex.net/$document',
    '@@.instantservice.com$document',
    '/addyn|*|adtech;',
    '@@||hulu-jsinject.com$jsinject',
    '@@||hulu-jsinject-image.com$image,jsinject',
    '@@||test-document.com$document',
    '@@||test-urlblock.com$urlblock',
    '@@||test-elemhide.com$elemhide',
    '@@/testelemhidenodomain$document',
    'lenta1.ru#@##social',
    'lenta2.ru#@##social',
    '###social',
    'yandex.ru###pub',
    'yandex.ru#@##pub',
    '@@/^https?\:\/\/(?!(qs\.ivwbox\.de|qs\.ioam.de|platform\.twitter\.com|connect\.facebook\.net|de\.ioam\.de|pubads\.g\.doubleclick\.net|stats\.wordpress\.com|www\.google-analytics\.com|www\.googletagservices\.com|apis\.google\.com|script\.ioam\.de)\/)/$script,third-party,domain=gamona.de',
    '/\.filenuke\.com/.*[a-zA-Z0-9]{4}/$script',
    '##.banner'
];
// Setup

/**
 * Checks Safari content blocker converter
 */
function testConvertRulesToJson() {
    var safariJSON = SafariContentBlockerConverter.convertArray(rules);
    var errors = [];
    _checkResult(safariJSON, errors);

    if (errors.length == 0) {
        return;
    } else {
        var message = 'Errors: ' + errors.length + '\n';

        errors.forEach(function (e) {
            message += e;
            message += '\n';
        });

        throw message;
    }
};
addTestCase(testConvertRulesToJson);

/**
 * Tests rule with $~third-party modifier
 */
function testConvertFirstPartyRule() {
    var ruleText = "@@||adriver.ru^$~third-party";
    var result = SafariContentBlockerConverter.convertArray([ ruleText ]);
    assertEquals(1, result.convertedCount);
    assertEquals(0, result.errorsCount);

    var converted = JSON.parse(result.converted);
    assertEquals(1, converted.length);

    var convertedRule = converted[0];
    assertEquals(URL_FILTER_REGEXP_START_URL + "adriver\\.ru[/:&?]?", convertedRule.trigger["url-filter"]);
    assertEmpty(convertedRule.trigger["if-domain"]);
    assertEmpty(convertedRule.trigger["unless-domain"]);
    assertNotEmpty(convertedRule.trigger["load-type"]);
    assertEquals("first-party", convertedRule.trigger["load-type"][0]);
    assertEquals("ignore-previous-rules", convertedRule.action.type);
}
addTestCase(testConvertFirstPartyRule);

/**
 * Test to check that we do not allow subdocument rules without third-party modifier
 */
function testConvertSubdocumentFirstPartyRule() {
    var ruleText = "||youporn.com^$subdocument,~third-party";
    var result = SafariContentBlockerConverter.convertArray([ ruleText ]);
    assertEquals(0, result.convertedCount);
    assertEquals(1, result.errorsCount);   
}
addTestCase(testConvertSubdocumentFirstPartyRule);

/**
 * Test to check that we allow subdocument rules with third-party modifier
 */
function testConvertSubdocumentThirdPartyRule() {
    var ruleText = "||youporn.com^$subdocument,third-party";
    var result = SafariContentBlockerConverter.convertArray([ ruleText ]);
    assertEquals(1, result.convertedCount);
    assertEquals(0, result.errorsCount);
    
    var converted = JSON.parse(result.converted);
    assertEquals(1, converted.length);    
    
    var convertedRule = converted[0];
    assertEquals(URL_FILTER_REGEXP_START_URL + "youporn\\.com[/:&?]?", convertedRule.trigger["url-filter"]);
    assertEmpty(convertedRule.trigger["if-domain"]);
    assertEmpty(convertedRule.trigger["unless-domain"]);
    assertNotEmpty(convertedRule.trigger["load-type"]);
    assertNotEmpty(convertedRule.trigger["resource-type"]);
    assertEquals("third-party", convertedRule.trigger["load-type"][0]);
    assertEquals("document", convertedRule.trigger["resource-type"][0]);
    assertEquals("block", convertedRule.action.type);   
}
addTestCase(testConvertSubdocumentThirdPartyRule);

/**
 * Tests rule with empty regexp conversion
 */
function testConvertRuleWithEmptyRegexp() {
    var ruleText = "@@$image,domain=moonwalk.cc";
    var result = SafariContentBlockerConverter.convertArray([ ruleText ]);
    assertEquals(1, result.convertedCount);
    assertEquals(0, result.errorsCount);
    var converted = JSON.parse(result.converted);
    assertEquals(1, converted.length);

    var convertedRule = converted[0];
    assertEquals(".*", convertedRule.trigger["url-filter"]);
    assertEquals(1, convertedRule.trigger["if-domain"].length);
    assertEquals("*moonwalk.cc", convertedRule.trigger["if-domain"][0]);
    assertEquals(1, convertedRule.trigger["resource-type"].length);
    assertEquals("image", convertedRule.trigger["resource-type"][0]);
    assertEquals("ignore-previous-rules", convertedRule.action.type);
}
addTestCase(testConvertRuleWithEmptyRegexp);

/**
 * Tests rule for inverted whitelist
 */
function testInvertedWhitelist() {
    var ruleText = "@@||*$domain=~whitelisted.domain.com|~whitelisted.domain2.com";
    var result = SafariContentBlockerConverter.convertArray([ ruleText ]);
    assertEquals(1, result.convertedCount);
    assertEquals(0, result.errorsCount);
    var converted = JSON.parse(result.converted);
    assertEquals(1, converted.length);

    var convertedRule = converted[0];
    assertEquals(".*", convertedRule.trigger["url-filter"]);
    assertEquals(2, convertedRule.trigger["unless-domain"].length);
    assertEquals("*whitelisted.domain.com", convertedRule.trigger["unless-domain"][0]);
    assertEquals("*whitelisted.domain2.com", convertedRule.trigger["unless-domain"][1]);
    assertEquals("ignore-previous-rules", convertedRule.action.type);
}
addTestCase(testInvertedWhitelist);

/**
 * Checks regexp performance
 */
function testRegexpPerformance() {

    var count = 1 * 1000 * 1000;

    // Test URL with domain rule
    var regExp1 = new RegExp('^https?://([a-z0-9-_.]+\\.)?some-domain.com\\.com([^ a-zA-Z0-9.%]|$)', 'i');
    var regExp2 = new RegExp('^https?://[^.]+\\.?some-domain.com\\.com[/:&?]?', 'i');
    var regExp3 = new RegExp('^https?://([^/]*\\.)?some-domain.com\\.com[/:&?]?', 'i');
    var regExp4 = new RegExp('^https?://[^/]*\\.?some-domain.com\\.com[/:&?]?', 'i');
    _testCompare(regExp1, regExp2, count);
    _testCompare(regExp1, regExp3, count);
    _testCompare(regExp1, regExp4, count);
};

function _testCompare(regExp1, regExp2, count) {
    var startTime1 = new Date().getTime();
    _testRegex(regExp1, count);

    var startTime2 = new Date().getTime();
    _testRegex(regExp2, count);

    var elapsed1 = startTime2 - startTime1;
    var elapsed2 = new Date().getTime() - startTime2;

    var diff = Math.round((elapsed1 - elapsed2) / elapsed1 * 100, 2);
    _logDebug('Performance gain: ' + diff + '%');
}

function _testRegex(regExp, count) {

    var testUrl = 'http://www.some-domain.com/some-very/long/path/here/';
    var startTime = new Date().getTime();
    for (var i = 0; i < count; i++) {
        regExp.test(testUrl);
    }
    var elapsed = new Date().getTime() - startTime;
    _logDebug('Elapsed: ' + elapsed + 'ms');
}
addTestCase(testRegexpPerformance);

function _checkResult(json, errors) {
    var expectedErrorsCount = 4;
    var expectedCssTrunkatedCount = 4;

    if (json == null) {
        errors.push('Convertation failed!');
        return;
    }

    var expectedLength = (rules.length - expectedErrorsCount - expectedCssTrunkatedCount);
    if (json.convertedCount != expectedLength) {
        var message = 'Not all the rules converted \n';
        message += 'result:' + json.length;
        message += ' expected:' + expectedLength;
        errors.push(message);
    }

    if (json.errorsCount != expectedErrorsCount) {
        errors.push('Errors count is wrong');
    }

    if (json.overLimit != false) {
        errors.push('Overlimit flag is wrong');
    }

    var convertedString = json.converted;
    if (convertedString == null || convertedString == '') {
        errors.push('Converted block is wrong');
    }

    var converted = JSON.parse(convertedString);
    Log.debug(converted);
    if (converted.length != rules.length - expectedErrorsCount - expectedCssTrunkatedCount) {
        errors.push('Not all the rules presented in json');
    }

    function createErrorMessage(expected, current, valueName) {
        return 'Wrong ' + valueName + ' value for expected: ' + JSON.stringify(expected, null, '\t') + '\n'
            + 'actual:' + JSON.stringify(current, null, '\t') + '\n';
    }

    function checkRule(current, expected) {
        if (current.trigger['url-filter'] != expected.trigger['url-filter']) {
            errors.push(createErrorMessage(expected, current, 'trigger url-filter'));
        }

        if (expected.trigger['load-type']) {
            if (!current.trigger['load-type']
                || current.trigger['load-type'].toString() != expected.trigger['load-type'].toString()) {
                errors.push(createErrorMessage(expected, current, 'trigger load-type'));
            }
        }

        if (expected.trigger['if-domain']) {
            if (!current.trigger['if-domain']
                || current.trigger['if-domain'].toString() != expected.trigger['if-domain'].toString()) {
                errors.push(createErrorMessage(expected, current, 'trigger if-domain'));
            }
        }

        if (expected.trigger['unless-domain']) {
            if (!current.trigger['unless-domain']
                || current.trigger['unless-domain'].toString() != expected.trigger['unless-domain'].toString()) {
                errors.push(createErrorMessage(expected, current, 'trigger unless-domain'));
            }
        }

        if (expected.trigger['resource-type']) {
            if (!current.trigger['resource-type']
                || current.trigger['resource-type'].toString() != expected.trigger['resource-type'].toString()) {
                errors.push(createErrorMessage(expected, current, 'trigger resource-type'));
            }
        } else {
            if (current.trigger['resource-type']) {
                errors.push(createErrorMessage(expected, current, 'trigger resource-type'));
            }
        }

        if (expected.action['type']) {
            if (!current.action['type']
                || current.action['type'].toString() != expected.action['type'].toString()) {
                errors.push(createErrorMessage(expected, current, 'action type'));
            }
        }

        if (expected.action['selector']) {
            if (!current.action['selector']
                || current.action['selector'].toString() != expected.action['selector'].toString()) {
                errors.push(createErrorMessage(expected, current, 'action selector'));
            }
        }
    }

    // From test_safari_correct.js
    var correct = safariCorrectRules;

    converted.forEach(function (current, i) {
        var expected = correct[i];

        //Log.debug(current);
        //Log.debug(expected);

        checkRule(current, expected);
    });
}
