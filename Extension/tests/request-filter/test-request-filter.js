QUnit.test("General", function (assert) {
    var url = "https://test.com/";
    var referrer = "example.org";

    var rule = new adguard.rules.UrlFilterRule("||test.com^");

    var requestFilter = new adguard.RequestFilter();
    requestFilter.addRule(rule);

    var result = requestFilter.findRuleForRequest(url, referrer, adguard.RequestTypes.SUBDOCUMENT);
    assert.ok(result != null);
    assert.equal(result.ruleText, rule.ruleText);
});

QUnit.test("Whitelist rules selecting", function (assert) {

    var RequestTypes = adguard.RequestTypes;

    var url = "https://test.com/";
    var referrer = "http://example.org";

    var rule = new adguard.rules.UrlFilterRule("||test.com^");
    var whitelist = new adguard.rules.UrlFilterRule("@@||test.com^");
    var documentRule = new adguard.rules.UrlFilterRule("@@||test.com^$document");
    var genericHideRule = new adguard.rules.UrlFilterRule("@@||test.com^$generichide");

    var requestFilter = new adguard.RequestFilter();
    requestFilter.addRule(rule);

    var result;
    result = requestFilter.findRuleForRequest(url, referrer, RequestTypes.SUBDOCUMENT);
    assert.ok(result != null);
    assert.equal(result.ruleText, rule.ruleText);

    requestFilter.addRule(whitelist);
    result = requestFilter.findRuleForRequest(url, referrer, RequestTypes.SUBDOCUMENT, whitelist);
    assert.ok(result != null);
    assert.equal(result.ruleText, whitelist.ruleText);

    result = requestFilter.findWhiteListRule(url, referrer, RequestTypes.SUBDOCUMENT);
    assert.ok(result != null);
    assert.equal(result.ruleText, whitelist.ruleText);

    requestFilter.addRule(documentRule);
    result = requestFilter.findRuleForRequest(url, referrer, RequestTypes.SUBDOCUMENT, whitelist);
    assert.ok(result != null);
    assert.equal(result.ruleText, whitelist.ruleText);

    result = requestFilter.findWhiteListRule(url, referrer, RequestTypes.DOCUMENT);
    assert.ok(result != null);
    assert.equal(result.ruleText, documentRule.ruleText);

    requestFilter.removeRule(documentRule);
    requestFilter.addRule(genericHideRule);
    result = requestFilter.findWhiteListRule(url, referrer, RequestTypes.DOCUMENT);
    assert.ok(result != null);
    assert.equal(result.ruleText, genericHideRule.ruleText);
});

QUnit.test("Important modifier rules", function (assert) {

    var RequestTypes = adguard.RequestTypes;

    var url = "https://test.com/";
    var referrer = "http://example.org";

    var requestFilter = new adguard.RequestFilter();

    var rule = new adguard.rules.UrlFilterRule("||test.com^");
    var whitelist = new adguard.rules.UrlFilterRule("@@||test.com^");
    var important = new adguard.rules.UrlFilterRule("||test.com^$important");
    var documentRule = new adguard.rules.UrlFilterRule("@@||example.org^$document");

    assert.ok(rule.isFiltered(url, true, RequestTypes.IMAGE));
    assert.ok(whitelist.isFiltered(url, true, RequestTypes.IMAGE));
    assert.ok(important.isFiltered(url, true, RequestTypes.IMAGE));
    assert.ok(documentRule.isFiltered(referrer, true, RequestTypes.DOCUMENT));

    var result;

    requestFilter.addRule(rule);
    result = requestFilter.findRuleForRequest(url, referrer, RequestTypes.SUBDOCUMENT);
    assert.ok(result != null);
    assert.equal(result.ruleText, rule.ruleText);

    requestFilter.addRule(whitelist);
    result = requestFilter.findRuleForRequest(url, referrer, RequestTypes.SUBDOCUMENT, whitelist);
    assert.ok(result != null);
    assert.equal(result.ruleText, whitelist.ruleText);

    requestFilter.addRule(important);
    result = requestFilter.findRuleForRequest(url, referrer, RequestTypes.SUBDOCUMENT);
    assert.ok(result != null);
    assert.equal(result.ruleText, important.ruleText);

    requestFilter.addRule(documentRule);
    result = requestFilter.findRuleForRequest(url, referrer, RequestTypes.SUBDOCUMENT, documentRule);
    assert.ok(result != null);
    assert.equal(result.ruleText, documentRule.ruleText);
});

QUnit.test("CSP rules", function (assert) {

    var rule = new adguard.rules.UrlFilterRule('||xpanama.net^$third-party,csp=connect-src \'none\',domain=~example.org|merriam-webster.com');
    var requestFilter = new adguard.RequestFilter();
    requestFilter.addRule(rule);

    var rules = requestFilter.findCspRules('https://nop.xpanama.net/if.html?adflag=1&cb=kq4iOggNyP', 'https://www.merriam-webster.com/');
    assert.ok(rules.length === 1);
    assert.equal(rules[0].ruleText, rule.ruleText);

    rules = requestFilter.findCspRules('https://xpanama.net', 'https://example.org');
    assert.ok(!rules || rules.length === 0);

    // Add matching directive whitelist rule
    var directiveWhiteListRule = new adguard.rules.UrlFilterRule('@@||xpanama.net^$csp=connect-src \'none\'');
    requestFilter.addRule(directiveWhiteListRule);
    rules = requestFilter.findCspRules('https://xpanama.net', 'https://www.merriam-webster.com/');
    assert.ok(!rules || rules.length === 0);
    requestFilter.removeRule(directiveWhiteListRule);

    // Add global whitelist rule
    var globalWhiteListRule = new adguard.rules.UrlFilterRule('@@||xpanama.net^$csp');
    requestFilter.addRule(globalWhiteListRule);
    rules = requestFilter.findCspRules('https://xpanama.net', 'https://www.merriam-webster.com/');
    assert.ok(!rules || rules.length === 0);
    requestFilter.removeRule(globalWhiteListRule);

    // Add whitelist rule, but with not matched directive
    var directiveMissWhiteListRule = new adguard.rules.UrlFilterRule('@@||xpanama.net^$csp=frame-src \'none\'');
    requestFilter.addRule(directiveMissWhiteListRule);
    rules = requestFilter.findCspRules('https://xpanama.net', 'https://www.merriam-webster.com/');
    assert.ok(rules.length === 1);
    assert.equal(rules[0].ruleText, rule.ruleText);

});

QUnit.test("Request filter performance", function (assert) {

    var done = assert.async();

    var readFromFile = function (path, successCallback) {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", path, false);
        xhr.send(null);
        successCallback(xhr.responseText);
    };

    var onFileLoaded = function (text) {
        assert.ok(text != null);

        var requestFilter = new adguard.RequestFilter();
        var rules = text.split("\n");
        assert.ok(rules.length > 0);
        for (var i = 0; i < rules.length; i++) {
            var rule = adguard.rules.builder.createRule(rules[i], adguard.utils.filters.USER_FILTER_ID);
            if (rule) {
                requestFilter.addRule(rule);
            }
        }

        var url = "https://thisistesturl.com/asdasdasd_adsajdasda_asdasdjashdkasdasdasdasd_adsajdasda_asdasdjashdkasd";

        var count = 5000;
        var startTime = new Date().getTime();
        for (var k = 0; k < count; k++) {
            requestFilter.findRuleForRequest(url, null, adguard.RequestTypes.SUBDOCUMENT);
        }

        var elapsed = new Date().getTime() - startTime;
        assert.ok(elapsed > 0);
        console.log("Total: " + elapsed / 1000000 + " ms");
        console.log("Average: " + elapsed / 1000 / count + " µs");

        //Total: 0.000006 ms
        //Average: 0.0000012 ms

        done();
    };

    readFromFile('test_filter.txt', onFileLoaded);
});