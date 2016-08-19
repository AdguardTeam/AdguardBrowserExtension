QUnit.test("Css Filter Rule", function (assert) {
    var ruleText = "~gamespot.com,~mint.com,~slidetoplay.com,~smh.com.au,~zattoo.com##.sponsored";
    var rule = new CssFilterRule(ruleText);

    assert.ok(rule.getRestrictedDomains().length > 0);
    assert.notOk(rule.whiteListRule);
    assert.notOk(rule.extendedCss);
    assert.equal(5, rule.getRestrictedDomains().length);
    assert.ok(rule.getRestrictedDomains().indexOf("gamespot.com") >= 0);
    assert.ok(rule.getRestrictedDomains().indexOf("mint.com") >= 0);
    assert.ok(rule.getRestrictedDomains().indexOf("slidetoplay.com") >= 0);
    assert.ok(rule.getRestrictedDomains().indexOf("smh.com.au") >= 0);
    assert.ok(rule.getRestrictedDomains().indexOf("zattoo.com") >= 0);
    assert.equal(".sponsored", rule.cssSelector);
});

QUnit.test("Css Filter Rule Extended Css", function (assert) {
    var ruleText = "~gamespot.com,~mint.com,~slidetoplay.com,~smh.com.au,~zattoo.com##.sponsored[-ext-contains=test]";
    var rule = new CssFilterRule(ruleText);

    assert.ok(rule.getRestrictedDomains().length > 0);
    assert.notOk(rule.whiteListRule);
    assert.ok(rule.extendedCss);
    assert.equal(".sponsored[-ext-contains=test]", rule.cssSelector);

    ruleText = "~gamespot.com,~mint.com,~slidetoplay.com,~smh.com.au,~zattoo.com##.sponsored[-ext-has=test]";
    rule = new CssFilterRule(ruleText);

    assert.ok(rule.getRestrictedDomains().length > 0);
    assert.notOk(rule.whiteListRule);
    assert.ok(rule.extendedCss);
    assert.equal(".sponsored[-ext-has=test]", rule.cssSelector);

    ruleText = "~gamespot.com,~mint.com,~slidetoplay.com,~smh.com.au,~zattoo.com##.sponsored:has(test)";
    rule = new CssFilterRule(ruleText);

    assert.ok(rule.getRestrictedDomains().length > 0);
    assert.notOk(rule.whiteListRule);
    assert.ok(rule.extendedCss);
    assert.equal(".sponsored:has(test)", rule.cssSelector);
});

QUnit.test("Css Filter WhiteList Rule", function (assert) {
    var ruleText = "gamespot.com,mint.com#@#.sponsored";
    var rule = new CssFilterRule(ruleText);

    assert.ok(rule.getPermittedDomains().length > 0);
    assert.ok(rule.whiteListRule);
    assert.equal(2, rule.getPermittedDomains().length);
    assert.ok(rule.getPermittedDomains().indexOf("gamespot.com") >= 0);
    assert.ok(rule.getPermittedDomains().indexOf("mint.com") >= 0);
    assert.equal(".sponsored", rule.cssSelector);
});

QUnit.test("Css Exception Rules", function (assert) {
    var rule = new CssFilterRule("##.sponsored");
    var rule1 = new CssFilterRule("adguard.com#@#.sponsored");
    var filter = new CssFilter([rule]);

    var css = filter.buildCss("adguard.com").css;
    var commonCss = filter.buildCss(null).css;
    assert.equal(css[0], commonCss[0]);

    filter.addRule(rule1);
    css = filter.buildCss("adguard.com").css;
    commonCss = filter.buildCss(null).css;
    assert.equal(css.length, 0);
    assert.equal(css.length, commonCss.length);

    css = filter.buildCss("another.domain").css;
    assert.ok(css.length > 0);

    filter.removeRule(rule1);
    css = filter.buildCss("adguard.com").css;
    commonCss = filter.buildCss(null).css;
    assert.ok(css.length > 0);
    assert.equal(css[0], commonCss[0]);
});

QUnit.test("Css GenericHide Exception Rules", function (assert) {
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
    assert.equal(css[0], commonCss[0]);

    filter.addRule(genericTwo);
    css = filter.buildCss("adguard.com").css;
    commonCss = filter.buildCss(null).css;
    assert.equal(css.length, 2);
    assert.equal(commonCss.length, 1);
    assert.equal(css[0], commonCss[0]);

    filter.addRule(nonGeneric);
    css = filter.buildCss("adguard.com").css;
    commonCss = filter.buildCss(null).css;
    assert.equal(css.length, 2);
    assert.equal(css[0], commonCss[0]);

    var otherCss = filter.buildCss("another.domain").css;
    assert.equal(otherCss.length, 2);

    filter.addRule(exceptionRule);
    css = filter.buildCss("adguard.com").css;
    //commonCss = filter.buildCss(null).css;
    assert.equal(css.length, 1);

    filter.addRule(genericHideRule);
    css = filter.buildCss("adguard.com", true).css;
    commonCss = filter.buildCss(null).css;
    otherCss = filter.buildCss("another.domain").css;
    assert.equal(css.length, 1);
    assert.ok(css[0].indexOf('#generic') < 0);
    assert.equal(commonCss.length, 1);
    assert.equal(otherCss.length, 2);

    filter.removeRule(exceptionRule);
    css = filter.buildCss("adguard.com", true).css;
    commonCss = filter.buildCss(null).css;
    otherCss = filter.buildCss("another.domain").css;
    assert.equal(css.length, 1);
    assert.equal(commonCss.length, 1);
    assert.equal(otherCss.length, 2);

    filter.addRule(elemHideRule);
    css = filter.buildCss("adguard.com", true).css;
    commonCss = filter.buildCss(null).css;
    otherCss = filter.buildCss("another.domain").css;
    assert.equal(css.length, 1);
    assert.equal(commonCss.length, 1);
    assert.equal(otherCss.length, 2);

    filter.addRule(injectRule);
    css = filter.buildCss("adguard.com", true).css;
    commonCss = filter.buildCss(null).css;
    otherCss = filter.buildCss("another.domain").css;
    assert.equal(css.length, 2);
    assert.equal(commonCss.length, 1);
    assert.equal(otherCss.length, 2);
});

QUnit.test("Ublock Css Injection Syntax Support", function (assert) {
    var ruleText = "yandex.ru##body:style(background:inherit;)";
    var cssFilterRule = new CssFilterRule(ruleText);
    assert.equal(ruleText, cssFilterRule.ruleText);
    assert.ok(cssFilterRule.isInjectRule);
    assert.notOk(cssFilterRule.whiteListRule);
    assert.equal("body { background:inherit; }", cssFilterRule.cssSelector);

    ruleText = "yandex.ru#@#body:style(background:inherit;)";
    cssFilterRule = new CssFilterRule(ruleText);
    assert.equal(ruleText, cssFilterRule.ruleText);
    assert.ok(cssFilterRule.isInjectRule);
    assert.ok(cssFilterRule.whiteListRule);
    assert.equal("body { background:inherit; }", cssFilterRule.cssSelector);
});

QUnit.test("Invalid Style Syntax", function (assert) {
    try {
        var ruleText = "yandex.ru##body:style()";
        new CssFilterRule(ruleText);
        throw new Error("Rule should not be parsed successfully");
    } catch (ex) {
        assert.equal(ex.message, 'Empty :style pseudo class: body:style()');
    }
});

QUnit.test("Valid Pseudo Class", function (assert) {
    var selector = "#main > table.w3-table-all.notranslate:first-child > tbody > tr:nth-child(17) > td.notranslate:nth-child(2)";
    var ruleText = "w3schools.com##" + selector;
    var cssFilterRule = new CssFilterRule(ruleText);
    assert.ok(cssFilterRule != null);
    assert.notOk(cssFilterRule.isInjectRule);
    assert.notOk(cssFilterRule.whiteListRule);
    assert.equal(selector, cssFilterRule.cssSelector);

    selector = "#:root div.ads";
    ruleText = "w3schools.com##" + selector;
    cssFilterRule = new CssFilterRule(ruleText);
    assert.ok(cssFilterRule != null);
    assert.notOk(cssFilterRule.isInjectRule);
    assert.notOk(cssFilterRule.whiteListRule);
    assert.equal(selector, cssFilterRule.cssSelector);

    selector = "#body div[attr='test']:first-child  div";
    ruleText = "w3schools.com##" + selector;
    cssFilterRule = new CssFilterRule(ruleText);
    assert.ok(cssFilterRule != null);
    assert.notOk(cssFilterRule.isInjectRule);
    assert.notOk(cssFilterRule.whiteListRule);
    assert.equal(selector, cssFilterRule.cssSelector);

    selector = ".todaystripe::after";
    ruleText = "w3schools.com##" + selector;
    cssFilterRule = new CssFilterRule(ruleText);
    assert.ok(cssFilterRule != null);
    assert.notOk(cssFilterRule.isInjectRule);
    assert.notOk(cssFilterRule.whiteListRule);
    assert.equal(selector, cssFilterRule.cssSelector);
});

QUnit.test("Filter Rule With Colon", function (assert) {
    var selector = "a[href^=\"https://w3schools.com\"]";
    var ruleText = "w3schools.com##" + selector;
    var cssFilterRule = new CssFilterRule(ruleText);
    assert.ok(cssFilterRule != null);
    assert.notOk(cssFilterRule.isInjectRule);
    assert.notOk(cssFilterRule.whiteListRule);
    assert.equal(selector, cssFilterRule.cssSelector);

    selector = "#Meebo\\:AdElement\\.Root";
    ruleText = "w3schools.com##" + selector;
    cssFilterRule = new CssFilterRule(ruleText);
    assert.ok(cssFilterRule != null);
    assert.notOk(cssFilterRule.isInjectRule);
    assert.notOk(cssFilterRule.whiteListRule);
    assert.equal(selector, cssFilterRule.cssSelector);
});

QUnit.test("Invalid Pseudo Class", function (assert) {
    try {
        var ruleText = "yandex.ru##test:matches(.whatisthis)";
        new CssFilterRule(ruleText);
        throw new Error("Rule should not be parsed successfully");
    } catch (ex) {
        assert.equal(ex.message, 'Unknown pseudo class: test:matches(.whatisthis)');
    }
});

QUnit.test("Extended Css Build", function (assert) {
    var rule = new CssFilterRule("adguard.com##.sponsored");
    var genericRule = new CssFilterRule("##.banner");
    var extendedCssRule = new CssFilterRule("adguard.com##.sponsored[-ext-contains=test]");
    var filter = new CssFilter([rule, genericRule, extendedCssRule]);

    var selectors, css, extendedCss, commonCss;

    selectors = filter.buildCss("adguard.com");
    css = selectors.css;
    extendedCss = selectors.extendedCss;
    commonCss = filter.buildCss(null).css;
    assert.equal(commonCss.length, 1);
    assert.equal(css.length, 2);
    assert.equal(extendedCss.length, 1);

    selectors = filter.buildCss("adguard.com", true);
    css = selectors.css;
    extendedCss = selectors.extendedCss;
    commonCss = filter.buildCss(null).css;
    assert.equal(commonCss.length, 1);
    assert.equal(css.length, 1);
    assert.equal(extendedCss.length, 1);
});

QUnit.test("Extended Css Build CssHits", function (assert) {
    var rule = new CssFilterRule("adguard.com##.sponsored");
    var genericRule = new CssFilterRule("##.banner");
    var extendedCssRule = new CssFilterRule("adguard.com##.sponsored[-ext-contains=test]");
    var filter = new CssFilter([rule, genericRule, extendedCssRule]);

    var selectors, css, extendedCss, commonCss;

    selectors = filter.buildCssHits("adguard.com");
    css = selectors.css;
    extendedCss = selectors.extendedCss;
    commonCss = filter.buildCss(null).css;
    assert.equal(commonCss.length, 1);
    assert.equal(css.length, 2);
    assert.equal(extendedCss.length, 1);

    selectors = filter.buildCssHits("adguard.com", '', true);
    css = selectors.css;
    extendedCss = selectors.extendedCss;
    commonCss = filter.buildCss(null).css;
    assert.equal(commonCss.length, 1);
    assert.equal(css.length, 1);
    assert.equal(extendedCss.length, 1);

});

QUnit.test("Extended Css Build Inject Css", function (assert) {
    var rule = new CssFilterRule("adguard.com##.sponsored");
    var genericRule = new CssFilterRule("##.banner");
    var extendedCssRule = new CssFilterRule("adguard.com##.sponsored[-ext-contains=test]");
    var filter = new CssFilter([rule, genericRule, extendedCssRule]);

    var selectors, css, extendedCss, commonCss;

    var injectRule = new CssFilterRule('adguard.com##body:style(background:inherit;)');
    assert.ok(injectRule.isInjectRule);
    assert.notOk(injectRule.extendedCss);
    filter.addRule(injectRule);

    selectors = filter.buildInjectCss("adguard.com");
    css = selectors.css;
    extendedCss = selectors.extendedCss;
    commonCss = filter.buildCss(null).css;
    assert.equal(commonCss.length, 1);
    assert.equal(css.length, 1);
    assert.equal(extendedCss.length, 1);

    selectors = filter.buildInjectCss("adguard.com", true);
    css = selectors.css;
    extendedCss = selectors.extendedCss;
    commonCss = filter.buildCss(null).css;
    assert.equal(commonCss.length, 1);
    assert.equal(css.length, 1);
    assert.equal(extendedCss.length, 1);

    var exceptionInjectRule = new CssFilterRule('adguard.com#@$#.sponsored { display: none!important;}');
    assert.ok(exceptionInjectRule.isInjectRule);
    assert.notOk(exceptionInjectRule.extendedCss);
    assert.ok(exceptionInjectRule.whiteListRule);
    filter.addRule(exceptionInjectRule);

    selectors = filter.buildInjectCss("adguard.com");
    css = selectors.css;
    extendedCss = selectors.extendedCss;
    commonCss = filter.buildCss(null).css;
    assert.equal(commonCss.length, 1);
    assert.equal(css.length, 1);
    assert.equal(extendedCss.length, 1);
});
