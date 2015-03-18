function testPunycodeRule() {
	// "||яндекс.рф^$third-party,domain=почта.рф";
	var ruleText = decodeURIComponent("%7C%7C%D1%8F%D0%BD%D0%B4%D0%B5%D0%BA%D1%81.%D1%80%D1%84%5E%24third-party%2Cdomain%3D%D0%BF%D0%BE%D1%87%D1%82%D0%B0.%D1%80%D1%84");
	var rule = new UrlFilterRule(ruleText);
	assertNotNull(rule);

	assertEquals("https?://([a-z0-9-_.]+\\.)?xn--d1acpjx3f\\.xn--p1ai([^ a-zA-Z0-9.%]|$)", rule.getUrlRegExpSource());
	assertEquals("/https?:\\/\\/([a-z0-9-_.]+\\.)?xn--d1acpjx3f\\.xn--p1ai([^ a-zA-Z0-9.%]|$)/i", rule.getUrlRegExp().toString());
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
	assertEquals("https?://([a-z0-9-_.]+\\.)?tradedoubler\\.com\\/anet\\?type\\(iframe\\)loc\\(", rule.getUrlRegExpSource());
	assertEquals("/https?:\\/\\/([a-z0-9-_.]+\\.)?tradedoubler\\.com\\/anet\\?type\\(iframe\\)loc\\(/i", rule.getUrlRegExp().toString());
}
addTestCase(testWhiteListRule);

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
	assertEquals("https?://([a-z0-9-_.]+\\.)?test\\.ru\\/([^ a-zA-Z0-9.%]|$)", rule.getUrlRegExpSource());
	assertEquals("/https?:\\/\\/([a-z0-9-_.]+\\.)?test\\.ru\\/([^ a-zA-Z0-9.%]|$)/", rule.getUrlRegExp().toString());

	// Check rule work
	assertTrue(rule.isFiltered("http://test.ru/", true, "SUBDOCUMENT"));
	assertFalse(rule.isFiltered("http://TEst.ru/", false, "SUBDOCUMENT"));
	assertFalse(rule.isFiltered("http://test.ru", true, "SUBDOCUMENT"));
	assertTrue(rule.isPermitted("google.com"));
	assertTrue(rule.isPermitted("www.google.com"));
	assertFalse(rule.isPermitted("nigma.ru"));
	assertFalse(rule.isPermitted("www.nigma.ru"));
}
addTestCase(testUrlBlockingRule);

function testContentSpecificUrlBlock() {
	var mask = "||test.ru/$script";
	var rule = new UrlFilterRule(mask);
	assertTrue(rule.isFiltered("http://test.ru/script.js?ololo=ololo", false, "SCRIPT"));
	assertFalse(rule.isFiltered("http://test.ru/script.js?ololo=ololo", false, "XMLHTTPREQUEST"));
	assertFalse(rule.isFiltered("http://test.ru/?ololo=ololo", false, "SUBDOCUMENT"));
	assertFalse(rule.isFiltered("http://test.ru/image.png", false, "IMAGE"));
	mask = "||test.ru/$~script";
	rule = new UrlFilterRule(mask);
	assertFalse(rule.isFiltered("http://test.ru/script.js?ololo=ololo", false), "SCRIPT");
	assertTrue(rule.isFiltered("http://test.ru/script.js?ololo=ololo", false, "XMLHTTPREQUEST"));
	assertTrue(rule.isFiltered("http://test.ru/?ololo=ololo", false, "SUBDOCUMENT"));
	assertTrue(rule.isFiltered("http://test.ru/image.png", false, "IMAGE"));
	mask = "||test.ru/$script,image";
	rule = new UrlFilterRule(mask);
	assertTrue(rule.isFiltered("http://test.ru/script.js?ololo=ololo", false, "SCRIPT"));
	assertFalse(rule.isFiltered("http://test.ru/?ololo=ololo", false, "SUBDOCUMENT"));
	assertFalse(rule.isFiltered("http://test.ru/?ololo=ololo", false, "XMLHTTPREQUEST"));
	assertTrue(rule.isFiltered("http://test.ru/image.png", false, "IMAGE"));
	mask = "||test.ru/$~script,~image";
	rule = new UrlFilterRule(mask);
	assertFalse(rule.isFiltered("http://test.ru/script.js?ololo=ololo", false, "SCRIPT"));
	assertTrue(rule.isFiltered("http://test.ru/script.js?ololo=ololo", false, "XMLHTTPREQUEST"));
	assertTrue(rule.isFiltered("http://test.ru/?ololo=ololo", false, "SUBDOCUMENT"));
	assertFalse(rule.isFiltered("http://test.ru/image.png", false, "IMAGE"));
	mask = "||test.ru/$~script,image";
	rule = new UrlFilterRule(mask);
	assertFalse(rule.isFiltered("http://test.ru/script.js?ololo=ololo", false, "SCRIPT"));
	assertFalse(rule.isFiltered("http://test.ru/script.js?ololo=ololo", false, "XMLHTTPREQUEST"));
	assertFalse(rule.isFiltered("http://test.ru/?ololo=ololo", false, "SUBDOCUMENT"));
	assertTrue(rule.isFiltered("http://test.ru/image.png", false, "IMAGE"));
	assertFalse(rule.isFiltered("http://test.ru/image.png", false, "XMLHTTPREQUEST"));
	mask = "||test.ru/$script,image,xmlhttprequest";
	rule = new UrlFilterRule(mask);
	assertTrue(rule.isFiltered("http://test.ru/script.js?ololo=ololo", false, "SCRIPT"));
	assertFalse(rule.isFiltered("http://test.ru/?ololo=ololo", false, "SUBDOCUMENT"));
	assertTrue(rule.isFiltered("http://test.ru/?ololo=ololo", false, "XMLHTTPREQUEST"));
	assertTrue(rule.isFiltered("http://test.ru/image.png", false, "IMAGE"));
}
addTestCase(testContentSpecificUrlBlock);

function testUrlFilter() {
	var rule = new UrlFilterRule("||test.ru/^$domain=~nigma.ru|google.com,third-party,match-case");
	var rule1 = new UrlFilterRule("|http://www.google.com/ad/*");
	var rule2 = new UrlFilterRule("/partner.$domain=~8088.ru|~partner.microsoft.com|~r01.ru|~yandex.ru");

	var filter = new UrlFilter([rule, rule1, rule2]);

	assertFalse(filter.isFiltered("http://test.ru/", "test.test.ru", "SUBDOCUMENT", false) != null);
	assertTrue(filter.isFiltered("http://test.ru/", "www.google.com", "SUBDOCUMENT", true) != null);
	assertTrue(filter.isFiltered("http://www.google.com/ad/advertisment", "test.ru", "SUBDOCUMENT", true) != null);
	assertFalse(filter.isFiltered("http://test.ru/", "www.nigma.ru", "SUBDOCUMENT", true) != null);
	assertTrue(filter.isFiltered("http://partner.nekki.ru/banner.php?no_cache=41122&rotation_id=7", "rutracker.org", "SUBDOCUMENT", true) != null);
	assertFalse(filter.isFiltered("http://partner.yandex.ru", "yandex.ru", "SUBDOCUMENT", false) != null);
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
	assertTrue(rule.isFiltered("http://lenta.ru/news/2014/12/12/eurodollar/", false, "SUBDOCUMENT"));
	assertFalse(rule.isPermitted("adguard.com"));
	assertFalse(rule.isPermitted("nigma.ru"));
	assertFalse(rule.isFiltered("http://lenta.ru/news/a2014/12/12/eurodollar/", false, "SUBDOCUMENT"));
	assertFalse(rule.isFiltered("http://lenta.ru/news2014/12/12/eurodollar/", false, "SUBDOCUMENT"));
}
addTestCase(testRegexpRule);

function testComplexRegexpRule() {
	var mask = "/^https?\\:\\/\\/(?!(connect\\.facebook\\.net|ajax\\.cloudflare\\.com|www\\.google-analytics\\.com|ajax\\.googleapis\\.com|fbstatic-a\\.akamaihd\\.net|stats\\.g\\.doubleclick\\.net|api-secure\\.solvemedia\\.com|api\\.solvemedia\\.com|sb\\.scorecardresearch\\.com|www\\.google\\.com)\\/)/$script,third-party,xmlhttprequest,domain=mediafire.com";
	var rule = new UrlFilterRule(mask);
	assertTrue(rule.isFiltered("http://traratatata.com/blahblah.js", true, "SCRIPT"));
	assertFalse(rule.isFiltered("http://traratatata.com/blahblah.html", true, "SUBDOCUMENT"));
	assertTrue(rule.isFiltered("http://traratatata.com/blahblah.html", true, "XMLHTTPREQUEST"));
	assertFalse(rule.isFiltered("http://connect.facebook.net/blahblah.js", true, "SCRIPT"));
	assertFalse(rule.isFiltered("https://ajax.cloudflare.com/blahblah.js", true, "SCRIPT"));
	assertFalse(rule.isFiltered("https://www.google-analytics.com/blahblah.js", true, "SCRIPT"));
}
addTestCase(testComplexRegexpRule);
