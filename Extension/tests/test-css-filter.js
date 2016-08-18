/* global addTestCase */
/* global assertFalse */
/* global CssFilter */
/* global CssFilterRule */
/* global assertEquals */
/* global assertTrue */

function testCssFilterRule() {

	var ruleText = "~gamespot.com,~mint.com,~slidetoplay.com,~smh.com.au,~zattoo.com##.sponsored";
	var rule = new CssFilterRule(ruleText);

	assertTrue(rule.getRestrictedDomains().length > 0);
	assertFalse(rule.whiteListRule);
	assertFalse(rule.extendedCss);
	assertEquals(5, rule.getRestrictedDomains().length);
	assertTrue(rule.getRestrictedDomains().indexOf("gamespot.com") >= 0);
	assertTrue(rule.getRestrictedDomains().indexOf("mint.com") >= 0);
	assertTrue(rule.getRestrictedDomains().indexOf("slidetoplay.com") >= 0);
	assertTrue(rule.getRestrictedDomains().indexOf("smh.com.au") >= 0);
	assertTrue(rule.getRestrictedDomains().indexOf("zattoo.com") >= 0);
	assertEquals(".sponsored", rule.cssSelector);
}

addTestCase(testCssFilterRule);

function testCssFilterRuleExtendedCss() {

	var ruleText = "~gamespot.com,~mint.com,~slidetoplay.com,~smh.com.au,~zattoo.com##.sponsored[-ext-contains=test]";
	var rule = new CssFilterRule(ruleText);

	assertTrue(rule.getRestrictedDomains().length > 0);
	assertFalse(rule.whiteListRule);
	assertTrue(rule.extendedCss);
	assertEquals(".sponsored[-ext-contains=test]", rule.cssSelector);

	ruleText = "~gamespot.com,~mint.com,~slidetoplay.com,~smh.com.au,~zattoo.com##.sponsored[-ext-has=test]";
	rule = new CssFilterRule(ruleText);

	assertTrue(rule.getRestrictedDomains().length > 0);
	assertFalse(rule.whiteListRule);
	assertTrue(rule.extendedCss);
	assertEquals(".sponsored[-ext-has=test]", rule.cssSelector);

	ruleText = "~gamespot.com,~mint.com,~slidetoplay.com,~smh.com.au,~zattoo.com##.sponsored:has(test)";
	rule = new CssFilterRule(ruleText);

	assertTrue(rule.getRestrictedDomains().length > 0);
	assertFalse(rule.whiteListRule);
	assertTrue(rule.extendedCss);
	assertEquals(".sponsored:has(test)", rule.cssSelector);
}

addTestCase(testCssFilterRuleExtendedCss);


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

addTestCase(testCssFilterWhiteListRule);


function testCssExceptionRules() {

	var rule = new CssFilterRule("##.sponsored");
	var rule1 = new CssFilterRule("adguard.com#@#.sponsored");
	var filter = new CssFilter([rule]);

	var css = filter.buildCss("adguard.com").css;
	var commonCss = filter.buildCss(null).css;
	assertEquals(css[0], commonCss[0]);

	filter.addRule(rule1);
	css = filter.buildCss("adguard.com").css;
	commonCss = filter.buildCss(null).css;
	assertEquals(css.length, 0);
	assertEquals(css.length, commonCss.length);

	css = filter.buildCss("another.domain").css;
	assertTrue(css.length > 0);

	filter.removeRule(rule1);
	css = filter.buildCss("adguard.com").css;
	commonCss = filter.buildCss(null).css;
	assertTrue(css.length > 0);
	assertEquals(css[0], commonCss[0]);
}

addTestCase(testCssExceptionRules);


function testCssGenericHideExceptionRules() {

	var genericOne = new CssFilterRule("##.generic-one");
	var genericTwo = new CssFilterRule("~google.com,~yahoo.com###generic");
	var nonGeneric = new CssFilterRule("adguard.com##.non-generic");
	var injectRule = new CssFilterRule("adguard.com#$#body { background-color: #111!important; }");
	var exceptionRule = new CssFilterRule("adguard.com#@#.generic-one");
	var genericHideRule = new CssFilterRule("@@||adguard.com^$generichide");
	var elemHideRule = new CssFilterRule("@@||adguard.com^$elemhide");
	var filter = new CssFilter([genericOne]);

	var css = filter.buildCss("adguard.com").css;
	var commonCss = filter.buildCss(null).css;
	assertEquals(css[0], commonCss[0]);

	filter.addRule(genericTwo);
	css = filter.buildCss("adguard.com").css;
	commonCss = filter.buildCss(null).css;
	assertEquals(css.length, 2);
	assertEquals(commonCss.length, 1);
	assertEquals(css[0], commonCss[0]);

	filter.addRule(nonGeneric);
	css = filter.buildCss("adguard.com").css;
	commonCss = filter.buildCss(null).css;
	assertEquals(css.length, 2);
	assertEquals(css[0], commonCss[0]);

	var otherCss = filter.buildCss("another.domain").css;
	assertEquals(otherCss.length, 2);

	filter.addRule(exceptionRule);
	css = filter.buildCss("adguard.com").css;
	commonCss = filter.buildCss(null).css;
	assertEquals(css.length, 1);

	filter.addRule(genericHideRule);
	css = filter.buildCss("adguard.com", true).css;
	commonCss = filter.buildCss(null).css;
	otherCss = filter.buildCss("another.domain").css;
	assertEquals(css.length, 1);
	assertTrue(css[0].indexOf('#generic') < 0);
	assertEquals(commonCss.length, 1);
	assertEquals(otherCss.length, 2);

	filter.removeRule(exceptionRule);
	css = filter.buildCss("adguard.com", true).css;
	commonCss = filter.buildCss(null).css;
	otherCss = filter.buildCss("another.domain").css;
	assertEquals(css.length, 1);
	assertEquals(commonCss.length, 1);
	assertEquals(otherCss.length, 2);

	filter.addRule(elemHideRule);
	css = filter.buildCss("adguard.com", true).css;
	commonCss = filter.buildCss(null).css;
	otherCss = filter.buildCss("another.domain").css;
	assertEquals(css.length, 1);
	assertEquals(commonCss.length, 1);
	assertEquals(otherCss.length, 2);

	filter.addRule(injectRule);
	css = filter.buildCss("adguard.com", true).css;
	commonCss = filter.buildCss(null).css;
	otherCss = filter.buildCss("another.domain").css;
	assertEquals(css.length, 2);
	assertEquals(commonCss.length, 1);
	assertEquals(otherCss.length, 2);
}

addTestCase(testCssGenericHideExceptionRules);


function testUblockCssInjectionSyntaxSupport() {
	var ruleText = "yandex.ru##body:style(background:inherit;)";
	var cssFilterRule = new CssFilterRule(ruleText);
	assertEquals(ruleText, cssFilterRule.ruleText);
	assertTrue(cssFilterRule.isInjectRule);
	assertFalse(cssFilterRule.whiteListRule);
	assertEquals("body { background:inherit; }", cssFilterRule.cssSelector);

	ruleText = "yandex.ru#@#body:style(background:inherit;)";
	cssFilterRule = new CssFilterRule(ruleText);
	assertEquals(ruleText, cssFilterRule.ruleText);
	assertTrue(cssFilterRule.isInjectRule);
	assertTrue(cssFilterRule.whiteListRule);
	assertEquals("body { background:inherit; }", cssFilterRule.cssSelector);
}

addTestCase(testUblockCssInjectionSyntaxSupport);


function testInvalidStyleSyntax() {
	try {
		var ruleText = "yandex.ru##body:style()";
		new CssFilterRule(ruleText);
		throw new Error("Rule should not be parsed successfully");
	} catch (ex) {
		assertEquals(ex.message, 'Empty :style pseudo class: body:style()');
	}
}

addTestCase(testInvalidStyleSyntax);


function testValidPseudoClass() {
	var selector = "#main > table.w3-table-all.notranslate:first-child > tbody > tr:nth-child(17) > td.notranslate:nth-child(2)";
	var ruleText = "w3schools.com##" + selector;
	var cssFilterRule = new CssFilterRule(ruleText);
	assertNotNull(cssFilterRule);
	assertFalse(cssFilterRule.isInjectRule);
	assertFalse(cssFilterRule.whiteListRule);
	assertEquals(selector, cssFilterRule.cssSelector);

	selector = "#:root div.ads";
	ruleText = "w3schools.com##" + selector;
	cssFilterRule = new CssFilterRule(ruleText);
	assertNotNull(cssFilterRule);
	assertFalse(cssFilterRule.isInjectRule);
	assertFalse(cssFilterRule.whiteListRule);
	assertEquals(selector, cssFilterRule.cssSelector);

	selector = "#body div[attr='test']:first-child  div";
	ruleText = "w3schools.com##" + selector;
	cssFilterRule = new CssFilterRule(ruleText);
	assertNotNull(cssFilterRule);
	assertFalse(cssFilterRule.isInjectRule);
	assertFalse(cssFilterRule.whiteListRule);
	assertEquals(selector, cssFilterRule.cssSelector);

	selector = ".todaystripe::after";
	ruleText = "w3schools.com##" + selector;
	cssFilterRule = new CssFilterRule(ruleText);
	assertNotNull(cssFilterRule);
	assertFalse(cssFilterRule.isInjectRule);
	assertFalse(cssFilterRule.whiteListRule);
	assertEquals(selector, cssFilterRule.cssSelector);
}

addTestCase(testValidPseudoClass);


function testFilterRuleWithColon() {
	var selector = "a[href^=\"https://w3schools.com\"]";
	var ruleText = "w3schools.com##" + selector;
	var cssFilterRule = new CssFilterRule(ruleText);
	assertNotNull(cssFilterRule);
	assertFalse(cssFilterRule.isInjectRule);
	assertFalse(cssFilterRule.whiteListRule);
	assertEquals(selector, cssFilterRule.cssSelector);

	selector = "#Meebo\\:AdElement\\.Root";
	ruleText = "w3schools.com##" + selector;
	cssFilterRule = new CssFilterRule(ruleText);
	assertNotNull(cssFilterRule);
	assertFalse(cssFilterRule.isInjectRule);
	assertFalse(cssFilterRule.whiteListRule);
	assertEquals(selector, cssFilterRule.cssSelector);
}

addTestCase(testFilterRuleWithColon);


function testInvalidPseudoClass() {
	try {
		var ruleText = "yandex.ru##test:matches(.whatisthis)";
		new CssFilterRule(ruleText);
		throw new Error("Rule should not be parsed successfully");
	} catch (ex) {
		assertEquals(ex.message, 'Unknown pseudo class: test:matches(.whatisthis)');
	}
}

addTestCase(testInvalidPseudoClass);