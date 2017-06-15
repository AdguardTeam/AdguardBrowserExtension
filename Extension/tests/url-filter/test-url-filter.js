QUnit.test("Punycode rules", function (assert) {
    // "||яндекс.рф^$third-party,domain=почта.рф";
    var ruleText = decodeURIComponent("%7C%7C%D1%8F%D0%BD%D0%B4%D0%B5%D0%BA%D1%81.%D1%80%D1%84%5E%24third-party%2Cdomain%3D%D0%BF%D0%BE%D1%87%D1%82%D0%B0.%D1%80%D1%84");
    var rule = new adguard.rules.UrlFilterRule(ruleText);
    assert.ok(rule);

    assert.equal("^(http|https|ws|wss)://([a-z0-9-_.]+\\.)?xn--d1acpjx3f\\.xn--p1ai([^ a-zA-Z0-9.%]|$)", rule.getUrlRegExpSource());
    assert.equal("/^(http|https|ws|wss):\\/\\/([a-z0-9-_.]+\\.)?xn--d1acpjx3f\\.xn--p1ai([^ a-zA-Z0-9.%]|$)/i", rule.getUrlRegExp().toString());
    assert.equal("xn--80a1acny.xn--p1ai", rule.getPermittedDomains()[0]);
});

QUnit.test("Whitelist rule", function (assert) {
    var ruleText = "@@||tradedoubler.com/anet?type(iframe)loc($subdocument,domain=topzone.lt";
    var rule = new adguard.rules.UrlFilterRule(ruleText);

    assert.ok(rule);
    assert.ok(rule.whiteListRule);
    assert.notOk(rule.matchCase);
    assert.notOk(rule.isThirdParty);
    assert.notOk(rule.checkThirdParty);
    assert.ok(rule.getPermittedDomains().indexOf("topzone.lt") >= 0);
    assert.equal("^(http|https|ws|wss)://([a-z0-9-_.]+\\.)?tradedoubler\\.com\\/anet\\?type\\(iframe\\)loc\\(", rule.getUrlRegExpSource());
    assert.equal("/^(http|https|ws|wss):\\/\\/([a-z0-9-_.]+\\.)?tradedoubler\\.com\\/anet\\?type\\(iframe\\)loc\\(/i", rule.getUrlRegExp().toString());
});

QUnit.test("Generic rule", function (assert) {
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

    var rule = new adguard.rules.UrlFilterRule(generic1RuleText);
    assert.ok(rule);
    assert.ok(rule.isGeneric());

    rule = new adguard.rules.UrlFilterRule(generic2RuleText);
    assert.ok(rule);
    assert.ok(rule.isGeneric());

    rule = new adguard.rules.UrlFilterRule(generic3RuleText);
    assert.ok(rule);
    assert.ok(rule.isGeneric());

    rule = new adguard.rules.UrlFilterRule(generic4RuleText);
    assert.ok(rule);
    assert.ok(rule.isGeneric());

    rule = new adguard.rules.UrlFilterRule(generic5RuleText);
    assert.ok(rule);
    assert.ok(rule.isGeneric());

    rule = new adguard.rules.UrlFilterRule(generic6RuleText);
    assert.ok(rule);
    assert.ok(rule.isGeneric());

    rule = new adguard.rules.UrlFilterRule(generic7RuleText);
    assert.ok(rule);
    assert.ok(rule.isGeneric());

    rule = new adguard.rules.UrlFilterRule(generic8RuleText);
    assert.ok(rule);
    assert.ok(rule.isGeneric());


    rule = new adguard.rules.UrlFilterRule(domain2RuleText);
    assert.ok(rule);
    assert.notOk(rule.isGeneric());

    rule = new adguard.rules.UrlFilterRule(domain3RuleText);
    assert.ok(rule);
    assert.notOk(rule.isGeneric());

    rule = new adguard.rules.UrlFilterRule(domain5RuleText);
    assert.ok(rule);
    assert.notOk(rule.isGeneric());
});

QUnit.test("Generic domain specific", function (assert) {

    var RequestTypes = adguard.RequestTypes;

    //Domain specific rule
    var ruleText = "||cdn.innity.net^$domain=sharejunction.com";
    var rule = new adguard.rules.UrlFilterRule(ruleText);

    assert.ok(rule);
    assert.notOk(rule.matchCase);
    assert.notOk(rule.isThirdParty);
    assert.notOk(rule.isGeneric());

    var filter = new adguard.rules.UrlFilter([rule]);
    assert.ok(filter.isFiltered("http://cdn.innity.net/admanager.js", "sharejunction.com", RequestTypes.SCRIPT, true) != null);

    //var genericBlockRuleText = "@@||sharejunction.com^$genericblock,generichide";
    //var genericBlockRule = new adguard.rules.UrlFilterRule(genericBlockRuleText);

    var filtered = filter.isFiltered("http://cdn.innity.net/admanager.js", "sharejunction.com", RequestTypes.SCRIPT, true, true);
    assert.ok(filtered != null);
    assert.notOk(filtered.whiteListRule);


    //Generic rule
    var genericRuleText = "||innity.net^$third-party";
    var genericRule = new adguard.rules.UrlFilterRule(genericRuleText);

    assert.notOk(genericRule.matchCase);
    assert.ok(genericRule.isThirdParty);
    assert.ok(genericRule.isGeneric());

    //Should be blocked by generic
    filter = new adguard.rules.UrlFilter([genericRule]);
    filtered = filter.isFiltered("http://cdn.innity.net/admanager.js", "sharejunction.com", RequestTypes.SCRIPT, true);
    assert.ok(filtered !== null);

    //Should be whitelisted by generic block
    filtered = filter.isFiltered("http://cdn.innity.net/admanager.js", "sharejunction.com", RequestTypes.SCRIPT, true, true);
    assert.notOk(filtered !== null);


    //2 rules together
    //Should be blocked by domain specific
    filter = new adguard.rules.UrlFilter([rule, genericRule]);
    filtered = filter.isFiltered("http://cdn.innity.net/admanager.js", "sharejunction.com", RequestTypes.SCRIPT, true, true);
    assert.ok(filtered !== null);
});

QUnit.test("Url blocking rule without domain", function (assert) {
    var ruleText = "-460x68.";
    var rule = new adguard.rules.UrlFilterRule(ruleText);

    assert.ok(rule);
    assert.notOk(rule.matchCase);
    assert.notOk(rule.isThirdParty);
    assert.notOk(rule.checkThirdParty);
});

QUnit.test("Url blocking rule", function (assert) {

    var RequestTypes = adguard.RequestTypes;

    var ruleText = "||test.ru/^$domain=~nigma.ru|google.com,third-party,match-case,popup";
    var rule = new adguard.rules.UrlFilterRule(ruleText);

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

QUnit.test("Content-specific URL blocking", function (assert) {

    var RequestTypes = adguard.RequestTypes;

    var mask = "||test.ru/$script";
    var rule = new adguard.rules.UrlFilterRule(mask);
    assert.ok(rule.isFiltered("http://test.ru/script.js?ololo=ololo", false, RequestTypes.SCRIPT));
    assert.notOk(rule.isFiltered("http://test.ru/script.js?ololo=ololo", false, RequestTypes.XMLHTTPREQUEST));
    assert.notOk(rule.isFiltered("http://test.ru/?ololo=ololo", false, RequestTypes.SUBDOCUMENT));
    assert.notOk(rule.isFiltered("http://test.ru/image.png", false, RequestTypes.IMAGE));

    mask = "||test.ru/$~script";
    rule = new adguard.rules.UrlFilterRule(mask);
    assert.notOk(rule.isFiltered("http://test.ru/script.js?ololo=ololo", false, RequestTypes.SCRIPT));
    assert.ok(rule.isFiltered("http://test.ru/script.js?ololo=ololo", false, RequestTypes.XMLHTTPREQUEST));
    assert.ok(rule.isFiltered("http://test.ru/?ololo=ololo", false, RequestTypes.SUBDOCUMENT));
    assert.ok(rule.isFiltered("http://test.ru/image.png", false, RequestTypes.IMAGE));
    assert.ok(rule.isFiltered("ws://test.ru/?ololo=ololo", false, RequestTypes.WEBSOCKET));

    mask = "||test.ru/$script,image";
    rule = new adguard.rules.UrlFilterRule(mask);
    assert.ok(rule.isFiltered("http://test.ru/script.js?ololo=ololo", false, RequestTypes.SCRIPT));
    assert.ok(rule.isFiltered("http://test.ru/image.png", false, RequestTypes.IMAGE));
    assert.notOk(rule.isFiltered("http://test.ru/?ololo=ololo", false, RequestTypes.SUBDOCUMENT));
    assert.notOk(rule.isFiltered("http://test.ru/?ololo=ololo", false, RequestTypes.XMLHTTPREQUEST));
    assert.notOk(rule.isFiltered("wss://test.ru/?ololo=ololo", false, RequestTypes.WEBSOCKET));

    mask = "||test.ru/$~script,~image";
    rule = new adguard.rules.UrlFilterRule(mask);
    assert.notOk(rule.isFiltered("http://test.ru/script.js?ololo=ololo", false, RequestTypes.SCRIPT));
    assert.ok(rule.isFiltered("http://test.ru/script.js?ololo=ololo", false, RequestTypes.XMLHTTPREQUEST));
    assert.ok(rule.isFiltered("http://test.ru/?ololo=ololo", false, RequestTypes.SUBDOCUMENT));
    assert.notOk(rule.isFiltered("http://test.ru/image.png", false, RequestTypes.IMAGE));

    mask = "||test.ru/$~script,image";
    rule = new adguard.rules.UrlFilterRule(mask);
    assert.notOk(rule.isFiltered("http://test.ru/script.js?ololo=ololo", false, RequestTypes.SCRIPT));
    assert.notOk(rule.isFiltered("http://test.ru/script.js?ololo=ololo", false, RequestTypes.XMLHTTPREQUEST));
    assert.notOk(rule.isFiltered("http://test.ru/?ololo=ololo", false, RequestTypes.SUBDOCUMENT));
    assert.ok(rule.isFiltered("http://test.ru/image.png", false, RequestTypes.IMAGE));
    assert.notOk(rule.isFiltered("http://test.ru/image.png", false, RequestTypes.XMLHTTPREQUEST));

    mask = "||test.ru/$script,image,xmlhttprequest";
    rule = new adguard.rules.UrlFilterRule(mask);
    assert.ok(rule.isFiltered("http://test.ru/script.js?ololo=ololo", false, RequestTypes.SCRIPT));
    assert.notOk(rule.isFiltered("http://test.ru/?ololo=ololo", false, RequestTypes.SUBDOCUMENT));
    assert.ok(rule.isFiltered("http://test.ru/?ololo=ololo", false, RequestTypes.XMLHTTPREQUEST));
    assert.ok(rule.isFiltered("http://test.ru/image.png", false, RequestTypes.IMAGE));

    mask = "||test.ru/$websocket";
    rule = new adguard.rules.UrlFilterRule(mask);
    assert.ok(rule.isFiltered("ws://test.ru/?ololo=ololo", false, RequestTypes.WEBSOCKET));
    assert.notOk(rule.isFiltered("http://test.ru/?ololo=ololo", false, RequestTypes.SUBDOCUMENT));
    assert.notOk(rule.isFiltered("http://test.ru/?ololo=ololo", false, RequestTypes.OTHER));

    mask = "stun:test.ru$webrtc";
    rule = new adguard.rules.UrlFilterRule(mask);
    assert.ok(rule.isFiltered("stun:test.ru:19302/?ololo=ololo", false, RequestTypes.WEBRTC));
    assert.notOk(rule.isFiltered("ws://test.ru/?ololo=ololo", false, RequestTypes.WEBSOCKET));
    assert.notOk(rule.isFiltered("http://test.ru/?ololo=ololo", false, RequestTypes.SUBDOCUMENT));
    assert.notOk(rule.isFiltered("http://test.ru/?ololo=ololo", false, RequestTypes.OTHER));

    mask = "test.com$content,script";
    rule = new adguard.rules.UrlFilterRule(mask);
    assert.ok(rule != null);

    mask = "test.com$content";
    try {
        rule = new adguard.rules.UrlFilterRule(mask);
        assert.ok(false);
    } catch (e) {
        assert.ok(e != null);
    }
});

QUnit.test("UrlFilter class tests", function (assert) {

    var RequestTypes = adguard.RequestTypes;

    var rule = new adguard.rules.UrlFilterRule("||test.ru/^$domain=~nigma.ru|google.com,third-party,match-case");
    var rule1 = new adguard.rules.UrlFilterRule("|http://www.google.com/ad/*");
    var rule2 = new adguard.rules.UrlFilterRule("/partner.$domain=~8088.ru|~partner.microsoft.com|~r01.ru|~yandex.ru");

    var filter = new adguard.rules.UrlFilter([rule, rule1, rule2]);

    assert.notOk(filter.isFiltered("http://test.ru/", "test.test.ru", RequestTypes.SUBDOCUMENT, false) != null);
    assert.ok(filter.isFiltered("http://test.ru/", "www.google.com", RequestTypes.SCRIPT, true) != null);
    assert.ok(filter.isFiltered("http://www.google.com/ad/advertisment", "test.ru", RequestTypes.SUBDOCUMENT, true) != null);
    assert.notOk(filter.isFiltered("http://test.ru/", "www.nigma.ru", RequestTypes.SUBDOCUMENT, true) != null);
    assert.ok(filter.isFiltered("http://partner.nekki.ru/banner.php?no_cache=41122&rotation_id=7", "rutracker.org", RequestTypes.SUBDOCUMENT, true) != null);
    assert.notOk(filter.isFiltered("http://partner.yandex.ru", "yandex.ru", RequestTypes.SUBDOCUMENT, false) != null);
});

QUnit.test("Regexp characters escaping", function (assert) {
    var rule = new adguard.rules.UrlFilterRule("imgur.com#@%#var addthis = { init: function() {}, addEventListener: function() {}, button: function() {}, counter: function() {} }");
    assert.ok(rule);
});

QUnit.test("Regexp rule", function (assert) {

    var RequestTypes = adguard.RequestTypes;

    var mask = "/news/\\d+/$domain=~nigma.ru|lenta.ru";
    var rule = new adguard.rules.UrlFilterRule(mask);
    assert.ok(rule.isPermitted("lenta.ru"));
    assert.ok(rule.isFiltered("http://lenta.ru/news/2014/12/12/eurodollar/", false, RequestTypes.SUBDOCUMENT));
    assert.notOk(rule.isPermitted("adguard.com"));
    assert.notOk(rule.isPermitted("nigma.ru"));
    assert.notOk(rule.isFiltered("http://lenta.ru/news/a2014/12/12/eurodollar/", false, RequestTypes.SUBDOCUMENT));
    assert.notOk(rule.isFiltered("http://lenta.ru/news2014/12/12/eurodollar/", false, RequestTypes.SUBDOCUMENT));
});

QUnit.test("Complex regexp rule", function (assert) {

    var RequestTypes = adguard.RequestTypes;

    var mask = "/^https?\\:\\/\\/(?!(connect\\.facebook\\.net|ajax\\.cloudflare\\.com|www\\.google-analytics\\.com|ajax\\.googleapis\\.com|fbstatic-a\\.akamaihd\\.net|stats\\.g\\.doubleclick\\.net|api-secure\\.solvemedia\\.com|api\\.solvemedia\\.com|sb\\.scorecardresearch\\.com|www\\.google\\.com)\\/)/$script,third-party,xmlhttprequest,domain=mediafire.com";
    var rule = new adguard.rules.UrlFilterRule(mask);
    assert.ok(rule.isFiltered("http://traratatata.com/blahblah.js", true, RequestTypes.SCRIPT));
    assert.notOk(rule.isFiltered("http://traratatata.com/blahblah.html", true, RequestTypes.SUBDOCUMENT));
    assert.ok(rule.isFiltered("http://traratatata.com/blahblah.html", true, RequestTypes.XMLHTTPREQUEST));
    assert.notOk(rule.isFiltered("http://connect.facebook.net/blahblah.js", true, RequestTypes.SCRIPT));
    assert.notOk(rule.isFiltered("https://ajax.cloudflare.com/blahblah.js", true, RequestTypes.SCRIPT));
    assert.notOk(rule.isFiltered("https://www.google-analytics.com/blahblah.js", true, RequestTypes.SCRIPT));
});

QUnit.test("Test UrlFilterRule Matching Everything", function (assert) {

    var RequestTypes = adguard.RequestTypes;

    var rule = new adguard.rules.UrlFilterRule("*$domain=example.org");
    assert.ok(rule.isFiltered("http://test.com", true, RequestTypes.SUBDOCUMENT));

    rule = new adguard.rules.UrlFilterRule("$domain=example.org");
    assert.ok(rule.isFiltered("http://test.com", true, RequestTypes.SUBDOCUMENT));

    rule = new adguard.rules.UrlFilterRule("*$websocket");
    // Rule is too wide, it will be considered invalid
    assert.notOk(rule.isFiltered("http://test.com", true, RequestTypes.SUBDOCUMENT));
});

QUnit.test("Test UrlFilterRule Matching Any Url", function (assert) {

    var ruleText = "*$domain=test.com";
    var rule = new adguard.rules.UrlFilterRule(ruleText);

    assert.notOk(rule.isThirdParty);
    assert.ok(rule.getPermittedDomains());
    assert.equal(1, rule.getPermittedDomains().length);
    assert.notOk(rule.shortcut);
    assert.ok(rule.isRegexRule);
    assert.ok(rule.isFiltered("http://example.com", true, adguard.RequestTypes.SCRIPT));

    ruleText = "$domain=test.com";
    rule = new adguard.rules.UrlFilterRule(ruleText);

    assert.notOk(rule.isThirdParty);
    assert.ok(rule.getPermittedDomains());
    assert.equal(1, rule.getPermittedDomains().length);
    assert.notOk(rule.shortcut);
    assert.ok(rule.isRegexRule);
    assert.ok(rule.isFiltered("http://example.com", true, adguard.RequestTypes.SCRIPT));

    ruleText = "||$domain=test.com";
    rule = new adguard.rules.UrlFilterRule(ruleText);

    assert.notOk(rule.isThirdParty);
    assert.ok(rule.getPermittedDomains());
    assert.equal(1, rule.getPermittedDomains().length);
    assert.notOk(rule.shortcut);
    assert.ok(rule.isFiltered("http://example.com", true, adguard.RequestTypes.SCRIPT));

    ruleText = "|$domain=test.com";
    rule = new adguard.rules.UrlFilterRule(ruleText);

    assert.notOk(rule.isThirdParty);
    assert.ok(rule.getPermittedDomains());
    assert.equal(1, rule.getPermittedDomains().length);
    assert.notOk(rule.shortcut);
    assert.ok(rule.isFiltered("http://example.com", true, adguard.RequestTypes.SCRIPT));

    ruleText = "@@||$xmlhttprequest,domain=last.fm";
    rule = new adguard.rules.UrlFilterRule(ruleText);

    assert.notOk(rule.isThirdParty);
    assert.ok(rule.getPermittedDomains());
    assert.equal(1, rule.getPermittedDomains().length);
    assert.notOk(rule.shortcut);
    assert.ok(rule.isFiltered("http://example.com", true, adguard.RequestTypes.XMLHTTPREQUEST));

    ruleText = "|$domain=test.com,script";
    rule = new adguard.rules.UrlFilterRule(ruleText);

    assert.notOk(rule.isThirdParty);
    assert.ok(rule.getPermittedDomains());
    assert.equal(1, rule.getPermittedDomains().length);
    assert.notOk(rule.shortcut);
    assert.ok(rule.isFiltered("http://example.com", true, adguard.RequestTypes.SCRIPT));

    ruleText = "||$domain=test.com,script";
    rule = new adguard.rules.UrlFilterRule(ruleText);

    assert.notOk(rule.isThirdParty);
    assert.ok(rule.getPermittedDomains());
    assert.equal(1, rule.getPermittedDomains().length);
    assert.notOk(rule.shortcut);
    assert.ok(rule.isFiltered("http://example.com", true, adguard.RequestTypes.SCRIPT));
});

QUnit.test("Important modifier rules", function (assert) {
    var rule = new adguard.rules.UrlFilterRule("||example.com^$important");
    assert.ok(rule.isImportant);

    rule = new adguard.rules.UrlFilterRule("||example.com^$\~important");
    assert.notOk(rule.isImportant);

    rule = new adguard.rules.UrlFilterRule("||example.com^");
    assert.notOk(rule.isImportant);
});

QUnit.test("Important modifier rules priority", function (assert) {
    var importantRule = new adguard.rules.UrlFilterRule("http://$important,domain=test.com");
    var basicRule = new adguard.rules.UrlFilterRule("||example.com^");

    assert.ok(importantRule.isFiltered("http://example.com", true, adguard.RequestTypes.IMAGE));
    assert.ok(importantRule.isPermitted("test.com"));
    assert.ok(basicRule.isFiltered("http://example.com", true, adguard.RequestTypes.IMAGE));
    assert.ok(basicRule.isPermitted("http://example.com"));

    var urlFilter = new adguard.rules.UrlFilter();
    urlFilter.addRule(basicRule);
    urlFilter.addRule(importantRule);

    var result = urlFilter.isFiltered("http://example.com", "test.com", adguard.RequestTypes.SUBDOCUMENT, true);
    assert.ok(result != null);
    assert.equal(result.ruleText, importantRule.ruleText);
});

QUnit.test("Rule content types", function (assert) {
    var basicRule = new adguard.rules.UrlFilterRule("||example.com^");
    assert.notOk(basicRule.checkContentType("DOCUMENT"));
    assert.notOk(basicRule.checkContentTypeIncluded("DOCUMENT"));

    assert.ok(basicRule.checkContentType("IMAGE"));
    assert.ok(basicRule.checkContentTypeIncluded("IMAGE"));

    var documentRule = new adguard.rules.UrlFilterRule("||example.com^$document");
    assert.ok(documentRule.checkContentType("DOCUMENT"));
    assert.ok(documentRule.checkContentTypeIncluded("DOCUMENT"));

    assert.ok(documentRule.checkContentType("ELEMHIDE"));
    assert.ok(documentRule.checkContentTypeIncluded("ELEMHIDE"));

    assert.notOk(documentRule.checkContentType("IMAGE"));
    assert.notOk(documentRule.checkContentTypeIncluded("IMAGE"));

    var elemhideRule = new adguard.rules.UrlFilterRule("||example.com^$elemhide");
    assert.ok(elemhideRule.checkContentType("DOCUMENT"));
    assert.notOk(elemhideRule.checkContentTypeIncluded("DOCUMENT"));

    assert.ok(elemhideRule.checkContentType("ELEMHIDE"));
    assert.ok(elemhideRule.checkContentTypeIncluded("ELEMHIDE"));

    assert.notOk(elemhideRule.checkContentType("IMAGE"));
    assert.notOk(elemhideRule.checkContentTypeIncluded("IMAGE"));
});

QUnit.test("Regexp rules shortcuts", function (assert) {
    assert.equal(new adguard.rules.UrlFilterRule('/quang%20cao/').shortcut, 'quang%20cao');
    assert.equal(new adguard.rules.UrlFilterRule('/YanAds/').shortcut, 'yanads');
    assert.equal(new adguard.rules.UrlFilterRule('/^http://m\.autohome\.com\.cn\/[a-z0-9]{32}\//$domain=m.autohome.com.cn').shortcut, 'autohome');
    assert.equal(new adguard.rules.UrlFilterRule('/cdsbData_gal/bannerFile/$image,domain=mybogo.net|zipbogo.net	').shortcut, 'cdsbdata_gal/bannerfile');
    assert.equal(new adguard.rules.UrlFilterRule('/http:\/\/rustorka.com\/[a-z]+\.js/$domain=rustorka.com').shortcut, 'http://rustorka');
    assert.equal(new adguard.rules.UrlFilterRule('/^http://www\.iqiyi\.com\/common\/flashplayer\/[0-9]{8}/[0-9a-z]{32}.swf/$domain=iqiyi.com').shortcut, 'com/common/flashplayer');
    assert.equal(new adguard.rules.UrlFilterRule('/ulightbox/$domain=hdkinomax.com|tvfru.net').shortcut, 'ulightbox');
    assert.equal(new adguard.rules.UrlFilterRule('/\.sharesix\.com/.*[a-zA-Z0-9]{4}/$script').shortcut, 'sharesix');
    assert.equal(new adguard.rules.UrlFilterRule('/serial_adv_files/$image,domain=xn--80aacbuczbw9a6a.xn--p1ai|куражбамбей.рф').shortcut, 'serial_adv_files');
    assert.ok(new adguard.rules.UrlFilterRule('/(.jpg)$/').shortcut === null);
    assert.ok(new adguard.rules.UrlFilterRule('@@||*$domain=lenta.ru').shortcut === null);
});

QUnit.test("Many rules in one rule filter", function (assert) {
    var rule = new adguard.rules.UrlFilterRule('$websocket,domain=anime-joy.tv|batmanstream.com|boards2go.com|boreburn.com|celebdirtylaundry.com|celebritymozo.com|cloudtime.to', 1);
    var filter = new adguard.rules.UrlFilter([rule]);
    assert.ok(filter);
    assert.equal(filter.getRules().length, 1);
});

QUnit.test("Escaped ampersand symbol in options", function (assert) {
    try {
        new adguard.rules.UrlFilterRule('||goodgame.ru/*.php?script=*vastInlineBannerTypeHtml$important,replace=/(<VAST[\s\S]*?>)[\s\S]*<\/VAST>/\\$1<\/VAST>/', 1);
        assert.ok(false);
    } catch (ex) {
        assert.ok(ex === 'Unknown option: REPLACE');
    }
});

QUnit.test('RegExp Rules Parsing', function (assert) {

    assert.ok(new adguard.rules.UrlFilterRule('/(.jpg)$/').isFiltered('http://test.ru/foo.jpg', false, adguard.RequestTypes.IMAGE));
    assert.notOk(new adguard.rules.UrlFilterRule('/(.jpg)$/').isFiltered('http://test.ru/foo.png', false, adguard.RequestTypes.IMAGE));

    try {
        new adguard.rules.UrlFilterRule('/.*/$replace=/hello/bug/');
        assert.ok(false);
    } catch (ex) {
        assert.ok(ex === 'Unknown option: REPLACE');
    }
});
