function testCssFilterRule() {

	var ruleText = "~gamespot.com,~mint.com,~slidetoplay.com,~smh.com.au,~zattoo.com##.sponsored";
	var rule = new CssFilterRule(ruleText);

	assertTrue(rule.getRestrictedDomains().length > 0);
	assertFalse(rule.whiteListRule);
	assertEquals(5, rule.getRestrictedDomains().length);
	assertTrue(rule.getRestrictedDomains().indexOf("gamespot.com") >= 0);
	assertTrue(rule.getRestrictedDomains().indexOf("mint.com") >= 0);
	assertTrue(rule.getRestrictedDomains().indexOf("slidetoplay.com") >= 0);
	assertTrue(rule.getRestrictedDomains().indexOf("smh.com.au") >= 0);
	assertTrue(rule.getRestrictedDomains().indexOf("zattoo.com") >= 0);
	assertEquals(".sponsored", rule.cssSelector);
}

function testCssFilterWhiteListRule() {
	var ruleText = "gamespot.com,mint.com#@#.sponsored";
	var rule = new CssFilterRule(ruleText);

	assertTrue(rule.getPermittedDomains().length > 0);
	assertTrue(rule.whiteListRule);
	assertEquals(2, rule.getPermittedDomains().length);
	assertTrue(rule.getPermittedDomains().indexOf("gamespot.com") >= 0);
	assertTrue(rule.getPermittedDomains().indexOf("mint.com") >= 0);
	assertEquals(".sponsored", rule.cssSelector);
}

function testCssExceptionRules() {

	var rule = new CssFilterRule("##.sponsored");
	var rule1 = new CssFilterRule("adguard.com#@#.sponsored");
	var filter = new CssFilter([rule]);

	var css = filter.buildCss("adguard.com");
	var commonCss = filter.buildCss(null);
	assertEquals(css[0], commonCss[0]);

	filter.addRule(rule1);
	css = filter.buildCss("adguard.com");
	commonCss = filter.buildCss(null);
	assertEquals(css.length, 0);
	assertEquals(css.length, commonCss.length);

	css = filter.buildCss("another.domain");
	assertTrue(css.length > 0);

	filter.removeRule(rule1);
	css = filter.buildCss("adguard.com");
	commonCss = filter.buildCss(null);
	assertTrue(css.length > 0);
	assertEquals(css[0], commonCss[0]);
}

addTestCase(testCssFilterRule);
addTestCase(testCssFilterWhiteListRule);
addTestCase(testCssExceptionRules);