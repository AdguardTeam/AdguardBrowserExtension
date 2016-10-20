QUnit.test("General", function(assert) {
    var url = "https://test.com/";
    var referrer = "example.org";

    var rule = new UrlFilterRule("||test.com^");

    var requestFilter = new RequestFilter();
    requestFilter.addRule(rule);

    var result = requestFilter.findRuleForRequest(url, referrer, RequestTypes.SUBDOCUMENT);
    assert.ok(result != null);
    assert.equal(result.ruleText, rule.ruleText);
});

QUnit.test("Whitelist rules selecting", function(assert) {
    var url = "https://test.com/";
    var referrer = "http://example.org";

    var rule = new UrlFilterRule("||test.com^");
    var whitelist = new UrlFilterRule("@@||test.com^");
    var documentRule = new UrlFilterRule("@@||test.com^$document");
    var genericHideRule = new UrlFilterRule("@@||test.com^$generichide");

    var requestFilter = new RequestFilter();
    requestFilter.addRule(rule);

    var result;
    result= requestFilter.findRuleForRequest(url, referrer, RequestTypes.SUBDOCUMENT);
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

QUnit.test("Important modifier rules", function(assert) {
    var url = "https://test.com/";
    var referrer = "http://example.org";

    var requestFilter = new RequestFilter();

    var rule = new UrlFilterRule("||test.com^");
    var whitelist = new UrlFilterRule("@@||test.com^");
    var important = new UrlFilterRule("||test.com^$important");
    var documentRule = new UrlFilterRule("@@||example.org^$document");

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
    assert.equal(result.ruleText, whitelist.ruleText);
});

QUnit.test("Request filter performance", function(assert) {

    var done = assert.async();

    var readFromFile = function (path, successCallback) {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", path, false);
        xhr.send(null);
        successCallback(xhr.responseText);
    };

    var onFileLoaded = function (text) {
        assert.ok(text != null);

        var requestFilter = new RequestFilter();
        var rules = text.split("\n");
        assert.ok(rules.length > 0);
        for (var i = 0; i < rules.length; i++) {
            try {
                var rule = FilterRuleBuilder.createRule(rules[i], AntiBannerFiltersId.USER_FILTER_ID);
                requestFilter.addRule(rule);
            } catch (ex) {
                //Ignore
            }
        }

        var url = "https://thisistesturl.com/asdasdasd_adsajdasda_asdasdjashdkasdasdasdasd_adsajdasda_asdasdjashdkasd";

        var count = 5000;
        var startTime = new Date().getTime();
        for (var k = 0; k < count; k++) {
            requestFilter.findRuleForRequest(url, null, RequestTypes.SUBDOCUMENT);
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