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
    //TODO: ??
    assert.ok(result != null);
    console.log(result);
});