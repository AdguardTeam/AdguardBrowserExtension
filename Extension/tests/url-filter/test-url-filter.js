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

QUnit.test("Url blocking rule without domain", function(assert) {
    var ruleText = "-460x68.";
    var rule = new UrlFilterRule(ruleText);

    assert.ok(rule);
    assert.notOk(rule.matchCase);
    assert.notOk(rule.isThirdParty);
    assert.notOk(rule.checkThirdParty);
});

QUnit.test("Url blocking rule", function(assert) {
    var ruleText = "||test.ru/^$domain=~nigma.ru|google.com,third-party,match-case,popup";
    var rule = new UrlFilterRule(ruleText);

    // Check rule properties
    assert.ok(rule.matchCase);
    assert.ok(rule.isThirdParty);
    assert.ok(rule.checkThirdParty);
    assert.equal("test.ru/", rule.shortcut);
    assert.equal("google.com", rule.getPermittedDomains()[0]);
    assert.equal("nigma.ru", rule.getRestrictedDomains()[0]);
    assert.equal("^(http|https|ws|wss)://([a-z0-9-_.]+\\.)?test\\.ru\\/([^ a-zA-Z0-9.%]|$)", rule.getUrlRegExpSource());
    assert.equal("/^(http|https|ws|wss):\\/\\/([a-z0-9-_.]+\\.)?test\\.ru\\/([^ a-zA-Z0-9.%]|$)/", rule.getUrlRegExp().toString());

    // Check rule work
    assert.ok(rule.isFiltered("http://test.ru/", true, RequestTypes.POPUP));
    assert.notOk(rule.isFiltered("http://test.ru/", true, RequestTypes.DOCUMENT));
    assert.notOk(rule.isFiltered("http://test.ru/", true, RequestTypes.SUBDOCUMENT));
    assert.notOk(rule.isFiltered("http://TEst.ru/", false, RequestTypes.SUBDOCUMENT));
    assert.notOk(rule.isFiltered("http://test.ru", true, RequestTypes.SUBDOCUMENT));
    assert.ok(rule.isPermitted("google.com"));
    assert.ok(rule.isPermitted("www.google.com"));
    assert.notOk(rule.isPermitted("nigma.ru"));
    assert.notOk(rule.isPermitted("www.nigma.ru"));
});

QUnit.test("Content-specific URL blocking", function(assert) {

    var mask = "||test.ru/$script";
    var rule = new UrlFilterRule(mask);
    assert.ok(rule.isFiltered("http://test.ru/script.js?ololo=ololo", false, RequestTypes.SCRIPT));
    assert.notOk(rule.isFiltered("http://test.ru/script.js?ololo=ololo", false, RequestTypes.XMLHTTPREQUEST));
    assert.notOk(rule.isFiltered("http://test.ru/?ololo=ololo", false, RequestTypes.SUBDOCUMENT));
    assert.notOk(rule.isFiltered("http://test.ru/image.png", false, RequestTypes.IMAGE));
    mask = "||test.ru/$~script";
    rule = new UrlFilterRule(mask);
    assert.notOk(rule.isFiltered("http://test.ru/script.js?ololo=ololo", false, RequestTypes.SCRIPT));
    assert.ok(rule.isFiltered("http://test.ru/script.js?ololo=ololo", false, RequestTypes.XMLHTTPREQUEST));
    assert.ok(rule.isFiltered("http://test.ru/?ololo=ololo", false, RequestTypes.SUBDOCUMENT));
    assert.ok(rule.isFiltered("http://test.ru/image.png", false, RequestTypes.IMAGE));
    assert.ok(rule.isFiltered("ws://test.ru/?ololo=ololo", false, RequestTypes.WEBSOCKET));
    mask = "||test.ru/$script,image";
    rule = new UrlFilterRule(mask);
    assert.ok(rule.isFiltered("http://test.ru/script.js?ololo=ololo", false, RequestTypes.SCRIPT));
    assert.ok(rule.isFiltered("http://test.ru/image.png", false, RequestTypes.IMAGE));    
    assert.notOk(rule.isFiltered("http://test.ru/?ololo=ololo", false, RequestTypes.SUBDOCUMENT));
    assert.notOk(rule.isFiltered("http://test.ru/?ololo=ololo", false, RequestTypes.XMLHTTPREQUEST));
    assert.notOk(rule.isFiltered("wss://test.ru/?ololo=ololo", false, RequestTypes.WEBSOCKET));
    mask = "||test.ru/$~script,~image";
    rule = new UrlFilterRule(mask);
    assert.notOk(rule.isFiltered("http://test.ru/script.js?ololo=ololo", false, RequestTypes.SCRIPT));
    assert.ok(rule.isFiltered("http://test.ru/script.js?ololo=ololo", false, RequestTypes.XMLHTTPREQUEST));
    assert.ok(rule.isFiltered("http://test.ru/?ololo=ololo", false, RequestTypes.SUBDOCUMENT));
    assert.notOk(rule.isFiltered("http://test.ru/image.png", false, RequestTypes.IMAGE));
    mask = "||test.ru/$~script,image";
    rule = new UrlFilterRule(mask);
    assert.notOk(rule.isFiltered("http://test.ru/script.js?ololo=ololo", false, RequestTypes.SCRIPT));
    assert.notOk(rule.isFiltered("http://test.ru/script.js?ololo=ololo", false, RequestTypes.XMLHTTPREQUEST));
    assert.notOk(rule.isFiltered("http://test.ru/?ololo=ololo", false, RequestTypes.SUBDOCUMENT));
    assert.ok(rule.isFiltered("http://test.ru/image.png", false, RequestTypes.IMAGE));
    assert.notOk(rule.isFiltered("http://test.ru/image.png", false, RequestTypes.XMLHTTPREQUEST));
    mask = "||test.ru/$script,image,xmlhttprequest";
    rule = new UrlFilterRule(mask);
    assert.ok(rule.isFiltered("http://test.ru/script.js?ololo=ololo", false, RequestTypes.SCRIPT));
    assert.notOk(rule.isFiltered("http://test.ru/?ololo=ololo", false, RequestTypes.SUBDOCUMENT));
    assert.ok(rule.isFiltered("http://test.ru/?ololo=ololo", false, RequestTypes.XMLHTTPREQUEST));
    assert.ok(rule.isFiltered("http://test.ru/image.png", false, RequestTypes.IMAGE));
    mask = "||test.ru/$websocket";
    rule = new UrlFilterRule(mask);
    assert.ok(rule.isFiltered("ws://test.ru/?ololo=ololo", false, RequestTypes.WEBSOCKET));
    assert.notOk(rule.isFiltered("http://test.ru/?ololo=ololo", false, RequestTypes.SUBDOCUMENT));
    assert.notOk(rule.isFiltered("http://test.ru/?ololo=ololo", false, RequestTypes.OTHER));
});

QUnit.test("UrlFilter class tests", function(assert) {
    var rule = new UrlFilterRule("||test.ru/^$domain=~nigma.ru|google.com,third-party,match-case");
    var rule1 = new UrlFilterRule("|http://www.google.com/ad/*");
    var rule2 = new UrlFilterRule("/partner.$domain=~8088.ru|~partner.microsoft.com|~r01.ru|~yandex.ru");

    var filter = new UrlFilter([rule, rule1, rule2]);

    assert.notOk(filter.isFiltered("http://test.ru/", "test.test.ru", RequestTypes.SUBDOCUMENT, false) != null);
    assert.ok(filter.isFiltered("http://test.ru/", "www.google.com", RequestTypes.SUBDOCUMENT, true) != null);
    assert.ok(filter.isFiltered("http://www.google.com/ad/advertisment", "test.ru", RequestTypes.SUBDOCUMENT, true) != null);
    assert.notOk(filter.isFiltered("http://test.ru/", "www.nigma.ru", RequestTypes.SUBDOCUMENT, true) != null);
    assert.ok(filter.isFiltered("http://partner.nekki.ru/banner.php?no_cache=41122&rotation_id=7", "rutracker.org", RequestTypes.SUBDOCUMENT, true) != null);
    assert.notOk(filter.isFiltered("http://partner.yandex.ru", "yandex.ru", RequestTypes.SUBDOCUMENT, false) != null);
});

QUnit.test("Regexp characters escaping", function(assert) {
    var rule = new UrlFilterRule("imgur.com#@%#var addthis = { init: function() {}, addEventListener: function() {}, button: function() {}, counter: function() {} }");
    assert.ok(rule);
});

QUnit.test("Regexp rule", function(assert) {
    var mask = "/news/\\d+/$domain=~nigma.ru|lenta.ru";
    var rule = new UrlFilterRule(mask);
    assert.ok(rule.isPermitted("lenta.ru"));
    assert.ok(rule.isFiltered("http://lenta.ru/news/2014/12/12/eurodollar/", false, RequestTypes.SUBDOCUMENT));
    assert.notOk(rule.isPermitted("adguard.com"));
    assert.notOk(rule.isPermitted("nigma.ru"));
    assert.notOk(rule.isFiltered("http://lenta.ru/news/a2014/12/12/eurodollar/", false, RequestTypes.SUBDOCUMENT));
    assert.notOk(rule.isFiltered("http://lenta.ru/news2014/12/12/eurodollar/", false, RequestTypes.SUBDOCUMENT));
});

QUnit.test("Complex regexp rule", function(assert) {
    var mask = "/^https?\\:\\/\\/(?!(connect\\.facebook\\.net|ajax\\.cloudflare\\.com|www\\.google-analytics\\.com|ajax\\.googleapis\\.com|fbstatic-a\\.akamaihd\\.net|stats\\.g\\.doubleclick\\.net|api-secure\\.solvemedia\\.com|api\\.solvemedia\\.com|sb\\.scorecardresearch\\.com|www\\.google\\.com)\\/)/$script,third-party,xmlhttprequest,domain=mediafire.com";
    var rule = new UrlFilterRule(mask);
    assert.ok(rule.isFiltered("http://traratatata.com/blahblah.js", true, RequestTypes.SCRIPT));
    assert.notOk(rule.isFiltered("http://traratatata.com/blahblah.html", true, RequestTypes.SUBDOCUMENT));
    assert.ok(rule.isFiltered("http://traratatata.com/blahblah.html", true, RequestTypes.XMLHTTPREQUEST));
    assert.notOk(rule.isFiltered("http://connect.facebook.net/blahblah.js", true, RequestTypes.SCRIPT));
    assert.notOk(rule.isFiltered("https://ajax.cloudflare.com/blahblah.js", true, RequestTypes.SCRIPT));
    assert.notOk(rule.isFiltered("https://www.google-analytics.com/blahblah.js", true, RequestTypes.SCRIPT));
});