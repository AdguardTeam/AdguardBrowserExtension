QUnit.test("Punycode rules", function(assert) {
    // "||яндекс.рф^$third-party,domain=почта.рф";
    var ruleText = decodeURIComponent("%7C%7C%D1%8F%D0%BD%D0%B4%D0%B5%D0%BA%D1%81.%D1%80%D1%84%5E%24third-party%2Cdomain%3D%D0%BF%D0%BE%D1%87%D1%82%D0%B0.%D1%80%D1%84");
    var rule = new UrlFilterRule(ruleText);
    assert.ok(rule);

    assert.equal("^(http|https|ws|wss)://([a-z0-9-_.]+\\.)?xn--d1acpjx3f\\.xn--p1ai([^ a-zA-Z0-9.%]|$)", rule.getUrlRegExpSource());
    assert.equal("/^(http|https|ws|wss):\\/\\/([a-z0-9-_.]+\\.)?xn--d1acpjx3f\\.xn--p1ai([^ a-zA-Z0-9.%]|$)/i", rule.getUrlRegExp().toString());
    assert.equal("xn--80a1acny.xn--p1ai", rule.getPermittedDomains()[0]);
});

QUnit.test("Whitelist rule", function(assert) {
    var ruleText = "@@||tradedoubler.com/anet?type(iframe)loc($subdocument,domain=topzone.lt";
    var rule = new UrlFilterRule(ruleText);

    assert.ok(rule);
    assert.ok(rule.whiteListRule);
    assert.notOk(rule.matchCase);
    assert.notOk(rule.isThirdParty);
    assert.notOk(rule.checkThirdParty);
    assert.ok(rule.getPermittedDomains().indexOf("topzone.lt") >= 0);
    assert.equal("^(http|https|ws|wss)://([a-z0-9-_.]+\\.)?tradedoubler\\.com\\/anet\\?type\\(iframe\\)loc\\(", rule.getUrlRegExpSource());
    assert.equal("/^(http|https|ws|wss):\\/\\/([a-z0-9-_.]+\\.)?tradedoubler\\.com\\/anet\\?type\\(iframe\\)loc\\(/i", rule.getUrlRegExp().toString());
});

QUnit.test("Generic rule", function(assert) {
    var domain2RuleText = "||test.ru/$script,domain=test2.ru";
    var domain3RuleText = "test/$script,domain=test2.ru";
    var domain5RuleText = "test/$script,domain=test1.ru|~test2.ru";

    var generic1RuleText = "/generic";
    var generic2RuleText = "/generic$domain=~test2.ru";
    var generic3RuleText = "-460x68.";
    var generic4RuleText = "generic";
    var generic5RuleText = "~generic.com";
    var generic6RuleText = "||test.ru/$script";
    var generic7RuleText = "test.ru/$domain=~test2.ru";
    var generic8RuleText = "||retarget.ssl-services.com^$third-party";

    var rule = new UrlFilterRule(generic1RuleText);
    assert.ok(rule);
    assert.ok(rule.isGeneric());

    rule = new UrlFilterRule(generic2RuleText);
    assert.ok(rule);
    assert.ok(rule.isGeneric());

    rule = new UrlFilterRule(generic3RuleText);
    assert.ok(rule);
    assert.ok(rule.isGeneric());

    rule = new UrlFilterRule(generic4RuleText);
    assert.ok(rule);
    assert.ok(rule.isGeneric());

    rule = new UrlFilterRule(generic5RuleText);
    assert.ok(rule);
    assert.ok(rule.isGeneric());

    rule = new UrlFilterRule(generic6RuleText);
    assert.ok(rule);
    assert.ok(rule.isGeneric());

    rule = new UrlFilterRule(generic7RuleText);
    assert.ok(rule);
    assert.ok(rule.isGeneric());

    rule = new UrlFilterRule(generic8RuleText);
    assert.ok(rule);
    assert.ok(rule.isGeneric());


    rule = new UrlFilterRule(domain2RuleText);
    assert.ok(rule);
    assert.notOk(rule.isGeneric());

    rule = new UrlFilterRule(domain3RuleText);
    assert.ok(rule);
    assert.notOk(rule.isGeneric());

    rule = new UrlFilterRule(domain5RuleText);
    assert.ok(rule);
    assert.notOk(rule.isGeneric());
});

QUnit.test("Generic domain specific", function(assert) {
    //Domain specific rule
    var ruleText = "||cdn.innity.net^$domain=sharejunction.com";
    var rule = new UrlFilterRule(ruleText);

    assert.ok(rule);
    assert.notOk(rule.matchCase);
    assert.notOk(rule.isThirdParty);
    assert.notOk(rule.isGeneric());

    var filter = new UrlFilter([rule]);
    assert.ok(filter.isFiltered("http://cdn.innity.net/admanager.js","sharejunction.com", RequestTypes.SCRIPT, true) != null);

    //var genericBlockRuleText = "@@||sharejunction.com^$genericblock,generichide";
    //var genericBlockRule = new UrlFilterRule(genericBlockRuleText);

    var filtered = filter.isFiltered("http://cdn.innity.net/admanager.js", "sharejunction.com", RequestTypes.SCRIPT, true, true);
    assert.ok(filtered != null);
    assert.notOk(filtered.whiteListRule);


    //Generic rule
    var genericRuleText = "||innity.net^$third-party";
    var genericRule = new UrlFilterRule(genericRuleText);

    assert.notOk(genericRule.matchCase);
    assert.ok(genericRule.isThirdParty);
    assert.ok(genericRule.isGeneric());

    //Should be blocked by generic
    filter = new UrlFilter([genericRule]);
    filtered = filter.isFiltered("http://cdn.innity.net/admanager.js", "sharejunction.com", RequestTypes.SCRIPT, true);
    assert.ok(filtered !== null);

    //Should be whitelisted by generic block
    filtered = filter.isFiltered("http://cdn.innity.net/admanager.js", "sharejunction.com", RequestTypes.SCRIPT, true, true);
    assert.notOk(filtered !== null);


    //2 rules together
    //Should be blocked by domain specific
    filter = new UrlFilter([rule, genericRule]);
    filtered = filter.isFiltered("http://cdn.innity.net/admanager.js", "sharejunction.com", RequestTypes.SCRIPT, true, true);
    assert.ok(filtered !== null);
});