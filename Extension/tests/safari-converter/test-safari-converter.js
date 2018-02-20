/**
 * Test script for Safari content-blocking rules converter
 */

/* global SafariContentBlockerConverter, QUnit, URL_FILTER_REGEXP_START_URL, _checkResult */

QUnit.test("Convert rules to JSON", function (assert) {
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

QUnit.test("Convert a comment", function(assert) {
    var ruleText = "! this is a comment";
    var result = SafariContentBlockerConverter.convertArray([ruleText]);
    assert.equal(0, result.convertedCount);

    // Comments are simply ignored, that's why just a zero
    assert.equal(0, result.errorsCount);
});

QUnit.test("Convert a $network rule", function(assert) {
    var ruleText = "127.0.0.1$network";
    var result = SafariContentBlockerConverter.convertArray([ruleText]);

    assert.equal(0, result.convertedCount);
    assert.equal(1, result.errorsCount);
});

QUnit.test("Convert first-party rule", function (assert) {
    var ruleText = "@@||adriver.ru^$~third-party";
    var result = SafariContentBlockerConverter.convertArray([ruleText]);
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

QUnit.test("Convert websocket rules", function (assert) {
    var result = SafariContentBlockerConverter.convertArray(["||test.com^$websocket"]);
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


    result = SafariContentBlockerConverter.convertArray(["$websocket,domain=123movies.is"]);
    assert.equal(1, result.convertedCount);
    assert.equal(0, result.errorsCount);

    converted = JSON.parse(result.converted);
    assert.equal(1, converted.length);

    convertedRule = converted[0];
    assert.equal(convertedRule.trigger["url-filter"], URL_FILTER_WS_ANY_URL);
    assert.equal(convertedRule.trigger["if-domain"][0], "*123movies.is");
    assert.ok(convertedRule.trigger["resource-type"]);
    assert.equal(convertedRule.trigger["resource-type"][0], "raw");

    result = SafariContentBlockerConverter.convertArray([".rocks^$third-party,websocket"]);
    assert.equal(1, result.convertedCount);
    assert.equal(0, result.errorsCount);

    converted = JSON.parse(result.converted);
    assert.equal(1, converted.length);

    convertedRule = converted[0];
    assert.equal(convertedRule.trigger["url-filter"], URL_FILTER_WS_ANY_URL + ".*\\.rocks" + URL_FILTER_REGEXP_SEPARATOR);
    assert.notOk(convertedRule.trigger["if-domain"]);
    assert.notOk(convertedRule.trigger["unless-domain"]);
    assert.equal(convertedRule.trigger["load-type"], "third-party");
    assert.ok(convertedRule.trigger["resource-type"]);
    assert.equal(convertedRule.trigger["resource-type"][0], "raw");
});

QUnit.test("Convert ~script rule", function (assert) {
    var ruleText = "||test.com^$~script,third-party";
    var result = SafariContentBlockerConverter.convertArray([ruleText]);
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

QUnit.test("Convert subdocument first-party rule", function (assert) {
    var ruleText = "||youporn.com^$subdocument,~third-party";
    var result = SafariContentBlockerConverter.convertArray([ruleText]);
    assert.equal(0, result.convertedCount);
    assert.equal(1, result.errorsCount);
});

QUnit.test("Convert subdocument third-party rule", function (assert) {
    var ruleText = "||youporn.com^$subdocument,third-party";
    var result = SafariContentBlockerConverter.convertArray([ruleText]);
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

QUnit.test("Convert rule with empty regexp", function (assert) {
    var ruleText = "@@$image,domain=moonwalk.cc";
    var result = SafariContentBlockerConverter.convertArray([ruleText]);
    assert.equal(1, result.convertedCount);
    assert.equal(0, result.errorsCount);
    var converted = JSON.parse(result.converted);
    assert.equal(1, converted.length);

    var convertedRule = converted[0];
    assert.equal(URL_FILTER_ANY_URL, convertedRule.trigger["url-filter"]);
    assert.equal(1, convertedRule.trigger["if-domain"].length);
    assert.equal("*moonwalk.cc", convertedRule.trigger["if-domain"][0]);
    assert.equal(1, convertedRule.trigger["resource-type"].length);
    assert.equal("image", convertedRule.trigger["resource-type"][0]);
    assert.equal("ignore-previous-rules", convertedRule.action.type);
});

QUnit.test("Inverted whitelist", function (assert) {
    var ruleText = "@@||*$domain=~whitelisted.domain.com|~whitelisted.domain2.com";
    var result = SafariContentBlockerConverter.convertArray([ruleText]);
    assert.equal(1, result.convertedCount);
    assert.equal(0, result.errorsCount);
    var converted = JSON.parse(result.converted);
    assert.equal(1, converted.length);

    var convertedRule = converted[0];
    assert.equal(URL_FILTER_ANY_URL, convertedRule.trigger["url-filter"]);
    assert.equal(2, convertedRule.trigger["unless-domain"].length);
    assert.equal("*whitelisted.domain2.com", convertedRule.trigger["unless-domain"][0]);
    assert.equal("*whitelisted.domain.com", convertedRule.trigger["unless-domain"][1]);
    assert.equal("ignore-previous-rules", convertedRule.action.type);
});

QUnit.test("Generichide rules", function (assert) {
    var ruleText = '@@||hulu.com/page$generichide';

    var result = SafariContentBlockerConverter.convertArray([ruleText]);
    assert.equal(1, result.convertedCount);
    assert.equal(0, result.errorsCount);
    var converted = JSON.parse(result.converted);
    assert.equal(1, converted.length);

    var convertedRule = converted[0];
    assert.equal(convertedRule.action.type, "ignore-previous-rules");
    assert.equal(convertedRule.trigger["url-filter"], URL_FILTER_REGEXP_START_URL + 'hulu\\.com\\/page');
});

QUnit.test("Generic domain sensitive rules", function (assert) {
    var ruleText = '~google.com##banner';

    var result = SafariContentBlockerConverter.convertArray([ruleText]);
    assert.equal(1, result.convertedCount);
    assert.equal(0, result.errorsCount);
    var converted = JSON.parse(result.converted);
    assert.equal(1, converted.length);

    var convertedRule = converted[0];
    assert.equal(convertedRule.action.type, "css-display-none");
    assert.equal(convertedRule.trigger["unless-domain"], '*google.com');
    assert.equal(convertedRule.trigger["url-filter"], URL_FILTER_CSS_RULES);
});

QUnit.test("Generic domain sensitive rules sorting order", function (assert) {
    var result = SafariContentBlockerConverter.convertArray(['~example.org##generic', '##wide1', '##specific', '@@||example.org^$generichide']);
    assert.equal(result.convertedCount, 3);
    assert.equal(result.errorsCount, 0);
    var converted = JSON.parse(result.converted);
    assert.equal(converted.length, 3);

    assert.equal(converted[0].action.selector, "wide1, specific");
    assert.equal(converted[0].action.type, "css-display-none");
    assert.equal(converted[0].trigger["url-filter"], URL_FILTER_CSS_RULES);

    assert.equal(converted[1].action.selector, "generic");
    assert.equal(converted[1].action.type, "css-display-none");
    assert.equal(converted[1].trigger["unless-domain"], '*example.org');
    assert.equal(converted[1].trigger["url-filter"], URL_FILTER_CSS_RULES);

    assert.equal(converted[2].action.type, "ignore-previous-rules");
    assert.equal(converted[2].trigger["url-filter"], URL_FILTER_ANY_URL);
    assert.equal(converted[2].trigger["if-domain"], '*example.org');
});

QUnit.test("Convert cyrillic rules", function (assert) {
    var ruleText = 'меил.рф';
    var ruleTextMarkedDomain = '||меил.рф';

    var result = SafariContentBlockerConverter.convertArray([ruleText, ruleTextMarkedDomain]);
    assert.equal(2, result.convertedCount);
    assert.equal(0, result.errorsCount);
    var converted = JSON.parse(result.converted);
    assert.equal(2, converted.length);

    assert.equal(converted[0].trigger["url-filter"], "xn--e1agjb\\.xn--p1ai");
    assert.equal(converted[1].trigger["url-filter"], URL_FILTER_REGEXP_START_URL + "xn--e1agjb\\.xn--p1ai");
});

QUnit.test("Convert regexp rules", function (assert) {
    var ruleText = "/^https?://(?!static\.)([^.]+\.)+?fastpic\.ru[:/]/$script,domain=fastpic.ru";
    var result = SafariContentBlockerConverter.convertArray([ruleText]);
    assert.equal(0, result.convertedCount);
    assert.equal(1, result.errorsCount);

    ruleText = "^https?://(?!static)([^.]+)+?fastpicru[:/]$script,domain=fastpic.ru";
    result = SafariContentBlockerConverter.convertArray([ruleText]);
    assert.equal(1, result.convertedCount);
    assert.equal(0, result.errorsCount);

    ruleText = "@@/:\/\/.*[.]wp[.]pl\/[a-z0-9_]{30,50}[.][a-z]{2,5}[/:&?]?/";
    result = SafariContentBlockerConverter.convertArray([ruleText]);
    assert.equal(0, result.convertedCount);
    assert.equal(1, result.errorsCount);

    ruleText = "@@/:\/\/.*[.]wp[.]pl\/[a-z0-9_]+[.][a-z]+\\b/";
    result = SafariContentBlockerConverter.convertArray([ruleText]);
    assert.equal(0, result.convertedCount);
    assert.equal(1, result.errorsCount);
});

QUnit.test("CSS pseudo classes", function (assert) {
    // :style should be ignored
    var result = SafariContentBlockerConverter.convertArray(['yandex.ru##body:style(background:inherit;)', 'yandex.ru#@#body:style(background:inherit;)']);
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

QUnit.test("Regular expressions performance", function (assert) {

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

    var count = 1000 * 1000;

    // Test URL with domain rule
    var regExp1 = new RegExp('^https?://([a-z0-9-_.]+\\.)?some-domain.com\\.com([^ a-zA-Z0-9.%]|$)', 'i');
    var regExp2 = new RegExp('^https?://[^.]+\\.?some-domain.com\\.com[/:&?]?', 'i');
    var regExp3 = new RegExp('^https?://([^/]*\\.)?some-domain.com\\.com[/:&?]?', 'i');
    var regExp4 = new RegExp('^https?://[^/]*\\.?some-domain.com\\.com[/:&?]?', 'i');
    _testCompare(regExp1, regExp2, count);
    _testCompare(regExp1, regExp3, count);
    _testCompare(regExp1, regExp4, count);
});

QUnit.test("Content Blocker RegExp Problem", function (assert) {

    var rule = new adguard.rules.UrlFilterRule('@@||4players.de^$genericblock', 0);

    var result = SafariContentBlockerConverter.convertArray([rule]);
    assert.equal(result.errorsCount, 0);

    // Initialize regexp (while processing request from content script for example)
    assert.ok(!!rule.getUrlRegExp());

    // Convert again
    result = SafariContentBlockerConverter.convertArray([rule]);
    assert.equal(result.errorsCount, 0);
});

QUnit.test("UpperCase domains", function (assert) {

    var rule = new adguard.rules.UrlFilterRule('@@||UpperCase.test^$genericblock', 0);

    var result = SafariContentBlockerConverter.convertArray([rule]);
    assert.equal(result.errorsCount, 0);

    var converted = JSON.parse(result.converted);
    assert.equal(1, converted.length);

    assert.equal(converted[0].trigger["if-domain"], "*uppercase.test");
});

QUnit.test("CSP rules", function (assert) {

    var rule = new adguard.rules.UrlFilterRule('|blob:$script,domain=pornhub.com|xhamster.com|youporn.com', 0);

    var result = SafariContentBlockerConverter.convertArray([rule]);
    assert.equal(result.errorsCount, 1);
    assert.equal(result.convertedCount, 0);
});

QUnit.test("Elemhide rules", function (assert) {

    var ruleCss = new adguard.rules.CssFilterRule('lenta.ru###root > section.b-header.b-header-main.js-header:nth-child(4) > div.g-layout > div.row', 0);
    var ruleBlockingUrl = new adguard.rules.UrlFilterRule('https://icdn.lenta.ru/images/2017/04/10/16/20170410160659586/top7_f07b6db166774abba29e0de2e335f50a.jpg', 0);
    var ruleElemhide = new adguard.rules.UrlFilterRule('@@||lenta.ru^$elemhide', 0);
    var ruleElemhideGenericBlock = new adguard.rules.UrlFilterRule('@@||lenta.ru^$elemhide,genericblock', 0);

    var result = SafariContentBlockerConverter.convertArray([ruleCss, ruleBlockingUrl, ruleElemhide, ruleElemhideGenericBlock]);
    assert.equal(result.errorsCount, 0);

    var converted = JSON.parse(result.converted);
    assert.equal(4, converted.length);

    assert.equal(converted[0].action.selector, "#root > section.b-header.b-header-main.js-header:nth-child(4) > div.g-layout > div.row");
    assert.equal(converted[0].action.type, "css-display-none");

    assert.equal(converted[1].trigger["url-filter"], URL_FILTER_ANY_URL);
    assert.equal(converted[1].trigger["if-domain"], "*lenta.ru");
    assert.equal(converted[1].action.type, "ignore-previous-rules");

    assert.equal(converted[2].trigger["url-filter"], "https:\\/\\/icdn\\.lenta\\.ru\\/images\\/2017\\/04\\/10\\/16\\/20170410160659586\\/top7_f07b6db166774abba29e0de2e335f50a\\.jpg");
    assert.equal(converted[2].action.type, "block");

    assert.equal(converted[3].action.type, "ignore-previous-rules");
    assert.equal(converted[3].trigger["url-filter"], URL_FILTER_REGEXP_START_URL + "lenta\\.ru[/:&?]?");
});

QUnit.test("Important modifier rules sorting order", function(assert) {
    var result = SafariContentBlockerConverter.convertArray([
        '||example-url-block.org^',
        '||example-url-block-important.org^$important',
        '@@||example-url-block-exception.org^',
        '@@||example-url-block-exception-important.org^$important',
        '@@||example-url-block-exception-document.org^$document' ]);
    assert.equal(result.convertedCount, 5);
    assert.equal(result.errorsCount, 0);
    var converted = JSON.parse(result.converted);
    assert.equal(converted.length, 5);

    assert.equal(converted[0].action.type, "block");
    assert.equal(converted[0].trigger["url-filter"], URL_FILTER_REGEXP_START_URL + "example-url-block\\.org[/:&?]?");

    assert.equal(converted[1].action.type, "ignore-previous-rules");
    assert.equal(converted[1].trigger["url-filter"], URL_FILTER_REGEXP_START_URL + "example-url-block-exception\\.org[/:&?]?");

    assert.equal(converted[2].action.type, "block");
    assert.equal(converted[2].trigger["url-filter"], URL_FILTER_REGEXP_START_URL + "example-url-block-important\\.org[/:&?]?");

    assert.equal(converted[3].action.type, "ignore-previous-rules");
    assert.equal(converted[3].trigger["url-filter"], URL_FILTER_REGEXP_START_URL + "example-url-block-exception-important\\.org[/:&?]?");

    assert.equal(converted[4].action.type, "ignore-previous-rules");
    assert.equal(converted[4].trigger["url-filter"], URL_FILTER_ANY_URL);
    assert.equal(converted[4].trigger["if-domain"], "*example-url-block-exception-document.org");
});

QUnit.test("BadFilter rules", function (assert) {

    var rule = new adguard.rules.UrlFilterRule('||example.org^$image', 0);
    var ruleTwo = new adguard.rules.UrlFilterRule("||test.org^");
    var badFilterRule = new adguard.rules.UrlFilterRule("||example.org^$badfilter,image");

    var result = SafariContentBlockerConverter.convertArray([rule, ruleTwo, badFilterRule]);
    assert.equal(result.errorsCount, 0);

    var converted = JSON.parse(result.converted);
    assert.equal(converted.length, 1);
    assert.equal(converted[0].trigger['url-filter'], URL_FILTER_REGEXP_START_URL + "test\\.org[/:&?]?");

});