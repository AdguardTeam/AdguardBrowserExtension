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

QUnit.test("Convert rules to JSON", function(assert) {
    var safariJSON = SafariContentBlockerConverter.convertArray(rules);
    var errors = [];
    _checkResult(safariJSON, errors);

    assert.equal(errors.length, 0);

    if (errors.length > 0) {
        var message = 'Errors: ' + errors.length + '\n';

        errors.forEach(function (e) {
            message += e;
            message += '\n';
        });

        assert.pushResult({
            result: false,
            actual: null,
            expected: null,
            message: message
        });
    }
});

QUnit.test("Convert first-party rule", function(assert) {
    var ruleText = "@@||adriver.ru^$~third-party";
    var result = SafariContentBlockerConverter.convertArray([ ruleText ]);
    assert.equal(1, result.convertedCount);
    assert.equal(0, result.errorsCount);

    var converted = JSON.parse(result.converted);
    assert.equal(1, converted.length);

    var convertedRule = converted[0];
    assert.equal(URL_FILTER_REGEXP_START_URL + "adriver\\.ru[/:&?]?", convertedRule.trigger["url-filter"]);
    assert.notOk(convertedRule.trigger["if-domain"]);
    assert.notOk(convertedRule.trigger["unless-domain"]);
    assert.ok(convertedRule.trigger["load-type"]);
    assert.equal("first-party", convertedRule.trigger["load-type"][0]);
    assert.equal("ignore-previous-rules", convertedRule.action.type);
});

QUnit.test("Convert websocket rule", function(assert) {
    var ruleText = "||test.com^$websocket";
    var result = SafariContentBlockerConverter.convertArray([ ruleText ]);
    assert.equal(1, result.convertedCount);
    assert.equal(0, result.errorsCount);

    var converted = JSON.parse(result.converted);
    assert.equal(1, converted.length);

    var convertedRule = converted[0];
    assert.equal(URL_FILTER_REGEXP_START_URL + "test\\.com[/:&?]?", convertedRule.trigger["url-filter"]);
    assert.notOk(convertedRule.trigger["if-domain"]);
    assert.notOk(convertedRule.trigger["unless-domain"]);
    assert.notOk(convertedRule.trigger["load-type"]);
    assert.ok(convertedRule.trigger["resource-type"]);
    assert.equal("raw", convertedRule.trigger["resource-type"][0]);
});

QUnit.test("Convert ~script rule", function(assert) {
    var ruleText = "||test.com^$~script,third-party";
    var result = SafariContentBlockerConverter.convertArray([ ruleText ]);
    assert.equal(1, result.convertedCount);
    assert.equal(0, result.errorsCount);

    var converted = JSON.parse(result.converted);
    assert.equal(1, converted.length);

    var convertedRule = converted[0];
    assert.equal(URL_FILTER_REGEXP_START_URL + "test\\.com[/:&?]?", convertedRule.trigger["url-filter"]);
    assert.notOk(convertedRule.trigger["if-domain"]);
    assert.notOk(convertedRule.trigger["unless-domain"]);
    assert.ok(convertedRule.trigger["load-type"]);
    assert.ok(convertedRule.trigger["resource-type"]);
    assert.equal(-1, convertedRule.trigger["resource-type"].indexOf("script"));
    assert.equal("third-party", convertedRule.trigger["load-type"][0]);
});

QUnit.test("Convert subdocument first-party rule", function(assert) {
    var ruleText = "||youporn.com^$subdocument,~third-party";
    var result = SafariContentBlockerConverter.convertArray([ ruleText ]);
    assert.equal(0, result.convertedCount);
    assert.equal(1, result.errorsCount);
});

QUnit.test("Convert subdocument third-party rule", function(assert) {
    var ruleText = "||youporn.com^$subdocument,third-party";
    var result = SafariContentBlockerConverter.convertArray([ ruleText ]);
    assert.equal(1, result.convertedCount);
    assert.equal(0, result.errorsCount);
    
    var converted = JSON.parse(result.converted);
    assert.equal(1, converted.length);    
    
    var convertedRule = converted[0];
    assert.equal(URL_FILTER_REGEXP_START_URL + "youporn\\.com[/:&?]?", convertedRule.trigger["url-filter"]);
    assert.notOk(convertedRule.trigger["if-domain"]);
    assert.notOk(convertedRule.trigger["unless-domain"]);
    assert.ok(convertedRule.trigger["load-type"]);
    assert.ok(convertedRule.trigger["resource-type"]);
    assert.equal("third-party", convertedRule.trigger["load-type"][0]);
    assert.equal("document", convertedRule.trigger["resource-type"][0]);
    assert.equal("block", convertedRule.action.type);
});

QUnit.test("Convert rule with empty regexp", function(assert) {
    var ruleText = "@@$image,domain=moonwalk.cc";
    var result = SafariContentBlockerConverter.convertArray([ ruleText ]);
    assert.equal(1, result.convertedCount);
    assert.equal(0, result.errorsCount);
    var converted = JSON.parse(result.converted);
    assert.equal(1, converted.length);

    var convertedRule = converted[0];
    assert.equal(".*", convertedRule.trigger["url-filter"]);
    assert.equal(1, convertedRule.trigger["if-domain"].length);
    assert.equal("*moonwalk.cc", convertedRule.trigger["if-domain"][0]);
    assert.equal(1, convertedRule.trigger["resource-type"].length);
    assert.equal("image", convertedRule.trigger["resource-type"][0]);
    assert.equal("ignore-previous-rules", convertedRule.action.type);
});

QUnit.test("Inverted whitelist", function(assert) {
    var ruleText = "@@||*$domain=~whitelisted.domain.com|~whitelisted.domain2.com";
    var result = SafariContentBlockerConverter.convertArray([ ruleText ]);
    assert.equal(1, result.convertedCount);
    assert.equal(0, result.errorsCount);
    var converted = JSON.parse(result.converted);
    assert.equal(1, converted.length);

    var convertedRule = converted[0];
    assert.equal(".*", convertedRule.trigger["url-filter"]);
    assert.equal(2, convertedRule.trigger["unless-domain"].length);
    assert.equal("*whitelisted.domain2.com", convertedRule.trigger["unless-domain"][0]);
    assert.equal("*whitelisted.domain.com", convertedRule.trigger["unless-domain"][1]);
    assert.equal("ignore-previous-rules", convertedRule.action.type);
});

QUnit.test("Generichide rules", function(assert) {
    var ruleText = '@@||hulu.com/page$generichide';

    var result = SafariContentBlockerConverter.convertArray([ ruleText ]);
    assert.equal(1, result.convertedCount);
    assert.equal(0, result.errorsCount);
    var converted = JSON.parse(result.converted);
    assert.equal(1, converted.length);

    var convertedRule = converted[0];
    assert.equal("ignore-previous-rules", convertedRule.action.type);
    assert.equal('^https?://([^/]*\\.)?hulu\\.com\\/page', convertedRule.trigger["url-filter"]);
    assert.equal(1, convertedRule.trigger["resource-type"].length);
    assert.equal("document", convertedRule.trigger["resource-type"][0]);
});

QUnit.test("Generic domain sensitive rules", function(assert) {
    var ruleText = '~google.com##banner';

    var result = SafariContentBlockerConverter.convertArray([ ruleText ]);
    assert.equal(1, result.convertedCount);
    assert.equal(0, result.errorsCount);
    var converted = JSON.parse(result.converted);
    assert.equal(1, converted.length);

    var convertedRule = converted[0];
    assert.equal(convertedRule.action.type, "css-display-none");
    assert.equal(convertedRule.trigger["unless-domain"], '*google.com');
    assert.equal(convertedRule.trigger["url-filter"], '.*');
});

QUnit.test("Convert cyrillic rules", function(assert) {
    var ruleText = 'меил.рф';
    var ruleTextMarkedDomain = '||меил.рф';

    var result = SafariContentBlockerConverter.convertArray([ ruleText, ruleTextMarkedDomain ]);
    assert.equal(2, result.convertedCount);
    assert.equal(0, result.errorsCount);
    var converted = JSON.parse(result.converted);
    assert.equal(2, converted.length);

    assert.equal(converted[0].trigger["url-filter"], "xn--e1agjb\\.xn--p1ai");
    assert.equal(converted[1].trigger["url-filter"], "^https?://([^/]*\\.)?xn--e1agjb\\.xn--p1ai");
});

QUnit.test("Convert regexp rules", function(assert) {
    var ruleText = "/^https?://(?!static\.)([^.]+\.)+?fastpic\.ru[:/]/$script,domain=fastpic.ru";
    var result = SafariContentBlockerConverter.convertArray([ ruleText ]);
    assert.equal(0, result.convertedCount);
    assert.equal(1, result.errorsCount);

    ruleText = "^https?://(?!static)([^.]+)+?fastpicru[:/]$script,domain=fastpic.ru";
    result = SafariContentBlockerConverter.convertArray([ ruleText ]);
    assert.equal(1, result.convertedCount);
    assert.equal(0, result.errorsCount);

    ruleText = "@@/:\/\/.*[.]wp[.]pl\/[a-z0-9_]{30,50}[.][a-z]{2,5}[/:&?]?/";
    result = SafariContentBlockerConverter.convertArray([ ruleText ]);
    assert.equal(0, result.convertedCount);
    assert.equal(1, result.errorsCount);

    ruleText = "@@/:\/\/.*[.]wp[.]pl\/[a-z0-9_]+[.][a-z]+\\b/";
    result = SafariContentBlockerConverter.convertArray([ ruleText ]);
    assert.equal(0, result.convertedCount);
    assert.equal(1, result.errorsCount);
});

QUnit.test("CSS pseudo classes", function(assert) {
    // :style should be ignored
    var result = SafariContentBlockerConverter.convertArray([ 'yandex.ru##body:style(background:inherit;)', 'yandex.ru#@#body:style(background:inherit;)' ]);
    assert.equal(0, result.convertedCount);
    assert.equal(2, result.errorsCount);

    // Invalid pseudo class
    result = SafariContentBlockerConverter.convertArray(['yandex.ru##test:has(.whatisthis)']);
    assert.equal(0, result.convertedCount);
    assert.equal(1, result.errorsCount);

    // Valid selectors
    result = SafariContentBlockerConverter.convertArray([
        'w3schools.com###main > table.w3-table-all.notranslate:first-child > tbody > tr:nth-child(17) > td.notranslate:nth-child(2)',
        'w3schools.com###:root div.ads',
        "w3schools.com###body div[attr='test']:first-child  div",
        'w3schools.com##.todaystripe::after'
    ]);
    assert.equal(4, result.convertedCount);
    assert.equal(0, result.errorsCount);
});

QUnit.test("Regular expressions performance", function(assert) {
    
    function _testCompare(regExp1, regExp2, count) {
        var startTime1 = new Date().getTime();
        _testRegex(regExp1, count);

        var startTime2 = new Date().getTime();
        _testRegex(regExp2, count);

        var elapsed1 = startTime2 - startTime1;
        var elapsed2 = new Date().getTime() - startTime2;

        var diff = Math.round((elapsed1 - elapsed2) / elapsed1 * 100, 2);
        assert.ok(1, 'Performance gain: ' + diff + '%');
    }

    function _testRegex(regExp, count) {

        var testUrl = 'http://www.some-domain.com/some-very/long/path/here/';
        var startTime = new Date().getTime();
        for (var i = 0; i < count; i++) {
            regExp.test(testUrl);
        }
        var elapsed = new Date().getTime() - startTime;
        assert.ok(1, 'Elapsed: ' + elapsed + 'ms');
    }

    var count = 1 * 1000 * 1000;

    // Test URL with domain rule
    var regExp1 = new RegExp('^https?://([a-z0-9-_.]+\\.)?some-domain.com\\.com([^ a-zA-Z0-9.%]|$)', 'i');
    var regExp2 = new RegExp('^https?://[^.]+\\.?some-domain.com\\.com[/:&?]?', 'i');
    var regExp3 = new RegExp('^https?://([^/]*\\.)?some-domain.com\\.com[/:&?]?', 'i');
    var regExp4 = new RegExp('^https?://[^/]*\\.?some-domain.com\\.com[/:&?]?', 'i');
    _testCompare(regExp1, regExp2, count);
    _testCompare(regExp1, regExp3, count);
    _testCompare(regExp1, regExp4, count);
});