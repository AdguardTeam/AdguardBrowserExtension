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

QUnit.test("Important modifier rules", function(assert) {
    var url = "https://test.com/";
    var referrer = "example.org";

    var requestFilter = new RequestFilter();

    var rule = new UrlFilterRule("||test.com^");
    var whitelist = new UrlFilterRule("@@||test.com^");
    var important = new UrlFilterRule("||test.com^$important");
    var documentRule = new UrlFilterRule("@@||example.org^$document");

    var result;

    requestFilter.addRule(rule);
    result = requestFilter.findRuleForRequest(url, referrer, RequestTypes.SUBDOCUMENT);
    assert.ok(result != null);
    assert.equal(result.ruleText, rule.ruleText);

    requestFilter.addRule(whitelist);
    result = requestFilter.findRuleForRequest(url, referrer, RequestTypes.SUBDOCUMENT);
    assert.ok(result != null);
    assert.equal(result.ruleText, whitelist.ruleText);

    requestFilter.addRule(important);
    result = requestFilter.findRuleForRequest(url, referrer, RequestTypes.SUBDOCUMENT);
    assert.ok(result != null);
    console.log(result);
    assert.equal(result.ruleText, important.ruleText);

    requestFilter.addRule(documentRule);
    result = requestFilter.findRuleForRequest(url, referrer, RequestTypes.SUBDOCUMENT);
    //TODO: Fix
    assert.ok(result != null);
    assert.equal(result.ruleText, documentRule.ruleText);
});

QUnit.test("Request filter performance", function(assert) {

    //TODO: Load txt
    var requestFilter = new RequestFilter();
    var rules = testFilterRules.split("\n");
    for (var i = 0; i < rules.length; i++) {
        requestFilter.addRule(rules[i]);
    }

    var url = "https://thisistesturl.com/asdasdasd_adsajdasda_asdasdjashdkasdasdasdasd_adsajdasda_asdasdjashdkasd";

    var count = 50;
    var startTime = new Date().getTime();
    for (var k = 0; k < count; k++) {
        requestFilter.findRuleForRequest(url, null, RequestTypes.SUBDOCUMENT);
    }

    var elapsed = new Date().getTime() - startTime;
    assert.ok(elapsed > 0);
    console.log("Total: " + elapsed / 1000000 + " ms");
    console.log("Average: " + elapsed / 1000 / count + " ms");
});