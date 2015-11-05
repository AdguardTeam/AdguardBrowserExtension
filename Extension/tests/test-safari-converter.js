/**
 * Test script for Safari content-blocking rules converter
 */

var Log = require('lib/utils/log').Log;
var SafariContentBlockerConverter = require('converter').SafariContentBlockerConverter;

//Setup
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
//Setup

Log.info('>>>>>>>>>>>>>>TEST started>>>>>>>>>>>>>>');

Log.info('>>>>>>>>>>>>>>Convert array>>>>>>>>>>>>>>');
var rules = [
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
    '@@test-document.com$document',
    '@@test-urlblock.com$urlblock',
    '@@test-elemhide.com$elemhide',
    '@@/testelemhidenodomain$document',
    'lenta1.ru#@##social',
    'lenta2.ru#@##social',
    '###social',
    'yandex.ru###pub',
    'yandex.ru#@##pub',
    '@@/^https?\:\/\/(?!(qs\.ivwbox\.de|qs\.ioam.de|platform\.twitter\.com|connect\.facebook\.net|de\.ioam\.de|pubads\.g\.doubleclick\.net|stats\.wordpress\.com|www\.google-analytics\.com|www\.googletagservices\.com|apis\.google\.com|script\.ioam\.de)\/)/$script,third-party,domain=gamona.de',
    '/\.filenuke\.com/.*[a-zA-Z0-9]{4}/$script'
];

var safariJSON = SafariContentBlockerConverter.convertArray(rules);
Log.debug(safariJSON);

function loadCorrect() {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", 'test_safari_correct.json', false);
    try {
        xhr.send();
    } catch (e) {
        return null;
    }
    return JSON.parse(xhr.responseText);
}

function checkResult(json, errors) {
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

    var correct = loadCorrect();

    converted.forEach(function (current, i) {
        var expected = correct[i];

        //Log.debug(current);
        //Log.debug(expected);

        checkRule(current, expected);
    });
}

var errors = [];
checkResult(safariJSON, errors);

Log.info('>>>>>>>>>>>>>>TEST finished>>>>>>>>>>>>>>');
if (errors.length == 0) {
    Log.info('>>>>>>>>>>>>>>SUCCESS>>>>>>>>>>>>>>');

    //var rules = [new FilterClasses.UrlFilterRule('test.com')];
    //var safariJSON = SafariContentBlockerConverter.convertArray(rules);
    //Log.debug(safariJSON);
} else {
    Log.error('>>>>>>>>>>>>>>FAILED>>>>>>>>>>>>>>');
    Log.error('>>>>>>>>>>>>>>Errors: ' + errors.length + '>>>>>>>>>>>>>>');
    errors.forEach(function (e) {
        Log.error(e);
    });
}
