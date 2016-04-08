function testPunycodeRule() {
    // "||яндекс.рф^$third-party,domain=почта.рф";
    var ruleText = decodeURIComponent("%7C%7C%D1%8F%D0%BD%D0%B4%D0%B5%D0%BA%D1%81.%D1%80%D1%84%5E%24third-party%2Cdomain%3D%D0%BF%D0%BE%D1%87%D1%82%D0%B0.%D1%80%D1%84");
    var rule = new UrlFilterRule(ruleText);
    assertNotNull(rule);

    assertEquals("^https?://([a-z0-9-_.]+\\.)?xn--d1acpjx3f\\.xn--p1ai([^ a-zA-Z0-9.%]|$)", rule.getUrlRegExpSource());
    assertEquals("/^https?:\\/\\/([a-z0-9-_.]+\\.)?xn--d1acpjx3f\\.xn--p1ai([^ a-zA-Z0-9.%]|$)/i", rule.getUrlRegExp().toString());
    assertEquals("xn--80a1acny.xn--p1ai", rule.getPermittedDomains()[0]);
}
addTestCase(testPunycodeRule);

function testWhiteListRule() {
    var ruleText = "@@||tradedoubler.com/anet?type(iframe)loc($subdocument,domain=topzone.lt";
    var rule = new UrlFilterRule(ruleText);

    assertNotNull(rule);
    assertTrue(rule.whiteListRule);
    assertFalse(rule.matchCase);
    assertFalse(rule.isThirdParty);
    assertFalse(rule.checkThirdParty);
//        assertFalse(rule.blockpopup);
    assertTrue(rule.getPermittedDomains().indexOf("topzone.lt") >= 0);
    assertEquals("^https?://([a-z0-9-_.]+\\.)?tradedoubler\\.com\\/anet\\?type\\(iframe\\)loc\\(", rule.getUrlRegExpSource());
    assertEquals("/^https?:\\/\\/([a-z0-9-_.]+\\.)?tradedoubler\\.com\\/anet\\?type\\(iframe\\)loc\\(/i", rule.getUrlRegExp().toString());
}
addTestCase(testWhiteListRule);

function testGenericRule() {

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
    assertNotNull(rule);
    assertTrue(rule.isGeneric());

    rule = new UrlFilterRule(generic2RuleText);
    assertNotNull(rule);
    assertTrue(rule.isGeneric());

    rule = new UrlFilterRule(generic3RuleText);
    assertNotNull(rule);
    assertTrue(rule.isGeneric());

    rule = new UrlFilterRule(generic4RuleText);
    assertNotNull(rule);
    assertTrue(rule.isGeneric());

    rule = new UrlFilterRule(generic5RuleText);
    assertNotNull(rule);
    assertTrue(rule.isGeneric());

    rule = new UrlFilterRule(generic6RuleText);
    assertNotNull(rule);
    assertTrue(rule.isGeneric());

    rule = new UrlFilterRule(generic7RuleText);
    assertNotNull(rule);
    assertTrue(rule.isGeneric());

    rule = new UrlFilterRule(generic8RuleText);
    assertNotNull(rule);
    assertTrue(rule.isGeneric());


    rule = new UrlFilterRule(domain2RuleText);
    assertNotNull(rule);
    assertFalse(rule.isGeneric());

    rule = new UrlFilterRule(domain3RuleText);
    assertNotNull(rule);
    assertFalse(rule.isGeneric());

    rule = new UrlFilterRule(domain5RuleText);
    assertNotNull(rule);
    assertFalse(rule.isGeneric());

}
addTestCase(testGenericRule);

function testGenericRuleDomainSpecific() {
    //Domain specific rule
    var ruleText = "||cdn.innity.net^$domain=sharejunction.com";
    var rule = new UrlFilterRule(ruleText);

    assertNotNull(rule);
    assertFalse(rule.matchCase);
    assertFalse(rule.isThirdParty);
    assertFalse(rule.isGeneric());

    var filter = new UrlFilter([rule]);
    assertTrue(filter.isFiltered("http://cdn.innity.net/admanager.js","sharejunction.com", RequestTypes.SCRIPT, true) != null);

    var genericBlockRuleText = "@@||sharejunction.com^$genericblock,generichide";
    var genericBlockRule = new UrlFilterRule(genericBlockRuleText);

    var filtered = filter.isFiltered("http://cdn.innity.net/admanager.js", "sharejunction.com", RequestTypes.SCRIPT, true, genericBlockRule);
    assertTrue(filtered != null);
    assertFalse(filtered.whiteListRule);


    //Generic rule
    var genericRuleText = "||innity.net^$third-party";
    var genericRule = new UrlFilterRule(genericRuleText);

    assertFalse(genericRule.matchCase);
    assertTrue(genericRule.isThirdParty);
    assertTrue(genericRule.isGeneric());

    filter = new UrlFilter([genericRule]);
    filtered = filter.isFiltered("http://cdn.innity.net/admanager.js", "sharejunction.com", RequestTypes.SCRIPT, true);
    assertTrue(filtered != null);
    //Should be blocked by generic
    assertFalse(filtered.whiteListRule);

    filtered = filter.isFiltered("http://cdn.innity.net/admanager.js", "sharejunction.com", RequestTypes.SCRIPT, true, genericBlockRule);
    assertTrue(filtered != null);
    //Should be whitelisted by generic block
    assertTrue(filtered.whiteListRule);


    //2 rules together
    filter = new UrlFilter([rule, genericRule]);
    filtered = filter.isFiltered("http://cdn.innity.net/admanager.js", "sharejunction.com", RequestTypes.SCRIPT, true, genericBlockRule);
    assertTrue(filtered != null);
    //Should be blocked by domain specific
    assertFalse(filtered.whiteListRule);
}
addTestCase(testGenericRuleDomainSpecific);

function testUrlBlockingRuleWithoutDomain() {
    var ruleText = "-460x68.";
    var rule = new UrlFilterRule(ruleText);

    assertNotNull(rule);
    assertFalse(rule.matchCase);
    assertFalse(rule.isThirdParty);
    assertFalse(rule.checkThirdParty);
//        assertFalse(rule.blockpopup);
}
addTestCase(testUrlBlockingRuleWithoutDomain);

function testUrlBlockingRule() {

    var ruleText = "||test.ru/^$domain=~nigma.ru|google.com,third-party,match-case,popup";
    var rule = new UrlFilterRule(ruleText);

    // Check rule properties
    assertTrue(rule.matchCase);
    assertTrue(rule.isThirdParty);
//        assertTrue(rule.blockpopup);
    assertTrue(rule.checkThirdParty);
    assertEquals("test.ru/", rule.shortcut);
    assertEquals("google.com", rule.getPermittedDomains()[0]);
    assertEquals("nigma.ru", rule.getRestrictedDomains()[0]);
    assertEquals("^https?://([a-z0-9-_.]+\\.)?test\\.ru\\/([^ a-zA-Z0-9.%]|$)", rule.getUrlRegExpSource());
    assertEquals("/^https?:\\/\\/([a-z0-9-_.]+\\.)?test\\.ru\\/([^ a-zA-Z0-9.%]|$)/", rule.getUrlRegExp().toString());

    // Check rule work
    assertTrue(rule.isFiltered("http://test.ru/", true, RequestTypes.POPUP));
    assertFalse(rule.isFiltered("http://test.ru/", true, RequestTypes.DOCUMENT));
    assertFalse(rule.isFiltered("http://test.ru/", true, RequestTypes.SUBDOCUMENT));
    assertFalse(rule.isFiltered("http://TEst.ru/", false, RequestTypes.SUBDOCUMENT));
    assertFalse(rule.isFiltered("http://test.ru", true, RequestTypes.SUBDOCUMENT));
    assertTrue(rule.isPermitted("google.com"));
    assertTrue(rule.isPermitted("www.google.com"));
    assertFalse(rule.isPermitted("nigma.ru"));
    assertFalse(rule.isPermitted("www.nigma.ru"));
}
addTestCase(testUrlBlockingRule);

function testContentSpecificUrlBlock() {
    var mask = "||test.ru/$script";
    var rule = new UrlFilterRule(mask);
    assertTrue(rule.isFiltered("http://test.ru/script.js?ololo=ololo", false, RequestTypes.SCRIPT));
    assertFalse(rule.isFiltered("http://test.ru/script.js?ololo=ololo", false, RequestTypes.XMLHTTPREQUEST));
    assertFalse(rule.isFiltered("http://test.ru/?ololo=ololo", false, RequestTypes.SUBDOCUMENT));
    assertFalse(rule.isFiltered("http://test.ru/image.png", false, RequestTypes.IMAGE));
    mask = "||test.ru/$~script";
    rule = new UrlFilterRule(mask);
    assertFalse(rule.isFiltered("http://test.ru/script.js?ololo=ololo", false, RequestTypes.SCRIPT));
    assertTrue(rule.isFiltered("http://test.ru/script.js?ololo=ololo", false, RequestTypes.XMLHTTPREQUEST));
    assertTrue(rule.isFiltered("http://test.ru/?ololo=ololo", false, RequestTypes.SUBDOCUMENT));
    assertTrue(rule.isFiltered("http://test.ru/image.png", false, RequestTypes.IMAGE));
    mask = "||test.ru/$script,image";
    rule = new UrlFilterRule(mask);
    assertTrue(rule.isFiltered("http://test.ru/script.js?ololo=ololo", false, RequestTypes.SCRIPT));
    assertFalse(rule.isFiltered("http://test.ru/?ololo=ololo", false, RequestTypes.SUBDOCUMENT));
    assertFalse(rule.isFiltered("http://test.ru/?ololo=ololo", false, RequestTypes.XMLHTTPREQUEST));
    assertTrue(rule.isFiltered("http://test.ru/image.png", false, RequestTypes.IMAGE));
    mask = "||test.ru/$~script,~image";
    rule = new UrlFilterRule(mask);
    assertFalse(rule.isFiltered("http://test.ru/script.js?ololo=ololo", false, RequestTypes.SCRIPT));
    assertTrue(rule.isFiltered("http://test.ru/script.js?ololo=ololo", false, RequestTypes.XMLHTTPREQUEST));
    assertTrue(rule.isFiltered("http://test.ru/?ololo=ololo", false, RequestTypes.SUBDOCUMENT));
    assertFalse(rule.isFiltered("http://test.ru/image.png", false, RequestTypes.IMAGE));
    mask = "||test.ru/$~script,image";
    rule = new UrlFilterRule(mask);
    assertFalse(rule.isFiltered("http://test.ru/script.js?ololo=ololo", false, RequestTypes.SCRIPT));
    assertFalse(rule.isFiltered("http://test.ru/script.js?ololo=ololo", false, RequestTypes.XMLHTTPREQUEST));
    assertFalse(rule.isFiltered("http://test.ru/?ololo=ololo", false, RequestTypes.SUBDOCUMENT));
    assertTrue(rule.isFiltered("http://test.ru/image.png", false, RequestTypes.IMAGE));
    assertFalse(rule.isFiltered("http://test.ru/image.png", false, RequestTypes.XMLHTTPREQUEST));
    mask = "||test.ru/$script,image,xmlhttprequest";
    rule = new UrlFilterRule(mask);
    assertTrue(rule.isFiltered("http://test.ru/script.js?ololo=ololo", false, RequestTypes.SCRIPT));
    assertFalse(rule.isFiltered("http://test.ru/?ololo=ololo", false, RequestTypes.SUBDOCUMENT));
    assertTrue(rule.isFiltered("http://test.ru/?ololo=ololo", false, RequestTypes.XMLHTTPREQUEST));
    assertTrue(rule.isFiltered("http://test.ru/image.png", false, RequestTypes.IMAGE));
}
addTestCase(testContentSpecificUrlBlock);

function testUrlFilter() {
    var rule = new UrlFilterRule("||test.ru/^$domain=~nigma.ru|google.com,third-party,match-case");
    var rule1 = new UrlFilterRule("|http://www.google.com/ad/*");
    var rule2 = new UrlFilterRule("/partner.$domain=~8088.ru|~partner.microsoft.com|~r01.ru|~yandex.ru");

    var filter = new UrlFilter([rule, rule1, rule2]);

    assertFalse(filter.isFiltered("http://test.ru/", "test.test.ru", RequestTypes.SUBDOCUMENT, false) != null);
    assertTrue(filter.isFiltered("http://test.ru/", "www.google.com", RequestTypes.SUBDOCUMENT, true) != null);
    assertTrue(filter.isFiltered("http://www.google.com/ad/advertisment", "test.ru", RequestTypes.SUBDOCUMENT, true) != null);
    assertFalse(filter.isFiltered("http://test.ru/", "www.nigma.ru", RequestTypes.SUBDOCUMENT, true) != null);
    assertTrue(filter.isFiltered("http://partner.nekki.ru/banner.php?no_cache=41122&rotation_id=7", "rutracker.org", RequestTypes.SUBDOCUMENT, true) != null);
    assertFalse(filter.isFiltered("http://partner.yandex.ru", "yandex.ru", RequestTypes.SUBDOCUMENT, false) != null);
}
addTestCase(testUrlFilter);

function testRegexpCharacterEscaping() {
    var rule = new UrlFilterRule("imgur.com#@%#var addthis = { init: function() {}, addEventListener: function() {}, button: function() {}, counter: function() {} }");
    assertNotNull(rule);
}
addTestCase(testRegexpCharacterEscaping);

function testRegexpRule() {
    var mask = "/news/\\d+/$domain=~nigma.ru|lenta.ru";
    var rule = new UrlFilterRule(mask);
    assertTrue(rule.isPermitted("lenta.ru"));
    assertTrue(rule.isFiltered("http://lenta.ru/news/2014/12/12/eurodollar/", false, RequestTypes.SUBDOCUMENT));
    assertFalse(rule.isPermitted("adguard.com"));
    assertFalse(rule.isPermitted("nigma.ru"));
    assertFalse(rule.isFiltered("http://lenta.ru/news/a2014/12/12/eurodollar/", false, RequestTypes.SUBDOCUMENT));
    assertFalse(rule.isFiltered("http://lenta.ru/news2014/12/12/eurodollar/", false, RequestTypes.SUBDOCUMENT));
}
addTestCase(testRegexpRule);

function testComplexRegexpRule() {
    var mask = "/^https?\\:\\/\\/(?!(connect\\.facebook\\.net|ajax\\.cloudflare\\.com|www\\.google-analytics\\.com|ajax\\.googleapis\\.com|fbstatic-a\\.akamaihd\\.net|stats\\.g\\.doubleclick\\.net|api-secure\\.solvemedia\\.com|api\\.solvemedia\\.com|sb\\.scorecardresearch\\.com|www\\.google\\.com)\\/)/$script,third-party,xmlhttprequest,domain=mediafire.com";
    var rule = new UrlFilterRule(mask);
    assertTrue(rule.isFiltered("http://traratatata.com/blahblah.js", true, RequestTypes.SCRIPT));
    assertFalse(rule.isFiltered("http://traratatata.com/blahblah.html", true, RequestTypes.SUBDOCUMENT));
    assertTrue(rule.isFiltered("http://traratatata.com/blahblah.html", true, RequestTypes.XMLHTTPREQUEST));
    assertFalse(rule.isFiltered("http://connect.facebook.net/blahblah.js", true, RequestTypes.SCRIPT));
    assertFalse(rule.isFiltered("https://ajax.cloudflare.com/blahblah.js", true, RequestTypes.SCRIPT));
    assertFalse(rule.isFiltered("https://www.google-analytics.com/blahblah.js", true, RequestTypes.SCRIPT));
}
addTestCase(testComplexRegexpRule);
