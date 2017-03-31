QUnit.test("Css Filter Rule", function (assert) {
    var ruleText = "~gamespot.com,~mint.com,~slidetoplay.com,~smh.com.au,~zattoo.com##.sponsored";
    var rule = new adguard.rules.CssFilterRule(ruleText);

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
    var rule = new adguard.rules.CssFilterRule(ruleText);

    assert.ok(rule.getRestrictedDomains().length > 0);
    assert.notOk(rule.whiteListRule);
    assert.ok(rule.extendedCss);
    assert.equal(".sponsored[-ext-contains=test]", rule.cssSelector);

    ruleText = "~gamespot.com,~mint.com,~slidetoplay.com,~smh.com.au,~zattoo.com##.sponsored[-ext-has=test]";
    rule = new adguard.rules.CssFilterRule(ruleText);

    assert.ok(rule.getRestrictedDomains().length > 0);
    assert.notOk(rule.whiteListRule);
    assert.ok(rule.extendedCss);
    assert.equal(".sponsored[-ext-has=test]", rule.cssSelector);

    ruleText = "~gamespot.com,~mint.com,~slidetoplay.com,~smh.com.au,~zattoo.com##.sponsored:has(test)";
    rule = new adguard.rules.CssFilterRule(ruleText);

    assert.ok(rule.getRestrictedDomains().length > 0);
    assert.notOk(rule.whiteListRule);
    assert.ok(rule.extendedCss);
    assert.equal(".sponsored:has(test)", rule.cssSelector);
});

QUnit.test("Css Filter WhiteList Rule", function (assert) {
    var ruleText = "gamespot.com,mint.com#@#.sponsored";
    var rule = new adguard.rules.CssFilterRule(ruleText);

    assert.ok(rule.getPermittedDomains().length > 0);
    assert.ok(rule.whiteListRule);
    assert.equal(2, rule.getPermittedDomains().length);
    assert.ok(rule.getPermittedDomains().indexOf("gamespot.com") >= 0);
    assert.ok(rule.getPermittedDomains().indexOf("mint.com") >= 0);
    assert.equal(".sponsored", rule.cssSelector);
});

QUnit.test("Css Exception Rules", function (assert) {
    var rule = new adguard.rules.CssFilterRule("##.sponsored");
    var rule1 = new adguard.rules.CssFilterRule("adguard.com#@#.sponsored");
    var filter = new adguard.rules.CssFilter([rule]);

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
    var genericOne = new adguard.rules.CssFilterRule("##.generic-one");
    var genericTwo = new adguard.rules.CssFilterRule("~google.com,~yahoo.com###generic");
    var nonGeneric = new adguard.rules.CssFilterRule("adguard.com##.non-generic");
    var injectRule = new adguard.rules.CssFilterRule("adguard.com#$#body { background-color: #111!important; }");
    var exceptionRule = new adguard.rules.CssFilterRule("adguard.com#@#.generic-one");
    var genericHideRule = new adguard.rules.CssFilterRule("@@||adguard.com^$generichide");
    var elemHideRule = new adguard.rules.CssFilterRule("@@||adguard.com^$elemhide");
    var filter = new adguard.rules.CssFilter([genericOne]);

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
    var cssFilterRule = new adguard.rules.CssFilterRule(ruleText);
    assert.equal(cssFilterRule.ruleText, ruleText);
    assert.ok(cssFilterRule.isInjectRule);
    assert.notOk(cssFilterRule.whiteListRule);
    assert.equal(cssFilterRule.cssSelector, "body { background:inherit; }");

    ruleText = "yandex.ru#@#body:style(background:inherit;)";
    cssFilterRule = new adguard.rules.CssFilterRule(ruleText);
    assert.equal(cssFilterRule.ruleText, ruleText);
    assert.ok(cssFilterRule.isInjectRule);
    assert.ok(cssFilterRule.whiteListRule);
    assert.equal(cssFilterRule.cssSelector, "body { background:inherit; }");

    ruleText = "yandex.ru##a[src^=\"http://domain.com\"]";
    cssFilterRule = new adguard.rules.CssFilterRule(ruleText);
    assert.equal(cssFilterRule.ruleText, ruleText);
    assert.notOk(cssFilterRule.isInjectRule);
    assert.notOk(cssFilterRule.whiteListRule);
    assert.equal(cssFilterRule.cssSelector, "a[src^=\"http://domain.com\"]");

    ruleText = "yandex.ru##[role='main']:style(display: none;)";
    cssFilterRule = new adguard.rules.CssFilterRule(ruleText);
    assert.equal(cssFilterRule.ruleText, ruleText);
    assert.ok(cssFilterRule.isInjectRule);
    assert.notOk(cssFilterRule.whiteListRule);
    assert.equal(cssFilterRule.cssSelector, "[role='main'] { display: none; }");

    ruleText = 'example.com##a[target="_blank"][href^="http://api.taboola.com/"]:style(display: none;)';
    cssFilterRule = new adguard.rules.CssFilterRule(ruleText);
    assert.equal(cssFilterRule.ruleText, ruleText);
    assert.equal(cssFilterRule.cssSelector, 'a[target="_blank"][href^="http://api.taboola.com/"] { display: none; }');
});

QUnit.test("Some Complex Selector Rules", function (assert) {
    var ruleText = 'example.com##td[valign="top"] > .mainmenu[style="padding:10px 0 0 0 !important;"]';
    var cssFilterRule = new adguard.rules.CssFilterRule(ruleText);
    assert.equal(cssFilterRule.ruleText, ruleText);
    assert.equal(cssFilterRule.cssSelector, 'td[valign="top"] > .mainmenu[style="padding:10px 0 0 0 !important;"]');

    ruleText = 'example.com##a[target="_blank"][href^="http://api.taboola.com/"]';
    cssFilterRule = new adguard.rules.CssFilterRule(ruleText);
    assert.equal(cssFilterRule.ruleText, ruleText);
    assert.equal(cssFilterRule.cssSelector, 'a[target="_blank"][href^="http://api.taboola.com/"]');

    ruleText = 'example.com###mz[width="100%"][valign="top"][style="padding:20px 30px 30px 30px;"] + td[width="150"][valign="top"][style="padding:6px 10px 0px 0px;"]:last-child';
    cssFilterRule = new adguard.rules.CssFilterRule(ruleText);
    assert.equal(cssFilterRule.ruleText, ruleText);
    assert.equal(cssFilterRule.cssSelector, '#mz[width="100%"][valign="top"][style="padding:20px 30px 30px 30px;"] + td[width="150"][valign="top"][style="padding:6px 10px 0px 0px;"]:last-child');

    ruleText = 'example.com###st-flash > div[class] > [style^="width:"]';
    cssFilterRule = new adguard.rules.CssFilterRule(ruleText);
    assert.equal(cssFilterRule.ruleText, ruleText);
    assert.equal(cssFilterRule.cssSelector, '#st-flash > div[class] > [style^="width:"]');

    ruleText = 'example.com##.stream-item[data-item-type="tweet"][data-item-id*=":"]';
    cssFilterRule = new adguard.rules.CssFilterRule(ruleText);
    assert.equal(cssFilterRule.ruleText, ruleText);
    assert.equal(cssFilterRule.cssSelector, '.stream-item[data-item-type="tweet"][data-item-id*=":"]');

    ruleText = 'example.com##[class][style*="data:image"]';
    cssFilterRule = new adguard.rules.CssFilterRule(ruleText);
    assert.equal(cssFilterRule.ruleText, ruleText);
    assert.equal(cssFilterRule.cssSelector, '[class][style*="data:image"]');

    ruleText = 'example.com##[onclick] > a[href^="javascript:"]';
    cssFilterRule = new adguard.rules.CssFilterRule(ruleText);
    assert.equal(cssFilterRule.ruleText, ruleText);
    assert.equal(cssFilterRule.cssSelector, '[onclick] > a[href^="javascript:"]');

    ruleText = 'example.com###main_content_wrap > table[width="100%"] > tbody > tr > td:empty+td > aside > a[href="#"]';
    cssFilterRule = new adguard.rules.CssFilterRule(ruleText);
    assert.equal(cssFilterRule.ruleText, ruleText);
    assert.equal(cssFilterRule.cssSelector, '#main_content_wrap > table[width=\"100%\"] > tbody > tr > td:empty+td > aside > a[href=\"#\"]');

    ruleText = 'pornolab.biz,pornolab.cc,pornolab.net###main_content_wrap > table[width="100%"] > tbody > tr > td:empty+td > aside > a[href="#"]';
    cssFilterRule = new adguard.rules.CssFilterRule(ruleText);

    assert.equal(cssFilterRule.cssSelector, '#main_content_wrap > table[width="100%"] > tbody > tr > td:empty+td > aside > a[href="#"]')
    assert.equal(cssFilterRule.ruleText, ruleText);

    ruleText = 'm.hindustantimes.com##.container-fluid > section.noBorder[-ext-has=">.recommended-story>.recommended-list>ul>li:not([class]):empty"]';
    cssFilterRule = new adguard.rules.CssFilterRule(ruleText);

    assert.equal(cssFilterRule.ruleText, ruleText);
    assert.equal(cssFilterRule.cssSelector, '.container-fluid > section.noBorder[-ext-has=\">.recommended-story>.recommended-list>ul>li:not([class]):empty\"]')
});

QUnit.test("Invalid Style Syntax", function (assert) {
    try {
        var ruleText = "yandex.ru##body:style()";
        new adguard.rules.CssFilterRule(ruleText);
        throw new Error("Rule should not be parsed successfully");
    } catch (ex) {
        assert.equal(ex.message, 'Empty :style pseudo class: body:style()');
    }
});

QUnit.test("Valid Pseudo Class", function (assert) {
    var selector = "#main > table.w3-table-all.notranslate:first-child > tbody > tr:nth-child(17) > td.notranslate:nth-child(2)";
    var ruleText = "w3schools.com##" + selector;
    var cssFilterRule = new adguard.rules.CssFilterRule(ruleText);
    assert.ok(cssFilterRule != null);
    assert.notOk(cssFilterRule.isInjectRule);
    assert.notOk(cssFilterRule.whiteListRule);
    assert.equal(selector, cssFilterRule.cssSelector);

    selector = "#:root div.ads";
    ruleText = "w3schools.com##" + selector;
    cssFilterRule = new adguard.rules.CssFilterRule(ruleText);
    assert.ok(cssFilterRule != null);
    assert.notOk(cssFilterRule.isInjectRule);
    assert.notOk(cssFilterRule.whiteListRule);
    assert.equal(selector, cssFilterRule.cssSelector);

    selector = "#body div[attr='test']:first-child  div";
    ruleText = "w3schools.com##" + selector;
    cssFilterRule = new adguard.rules.CssFilterRule(ruleText);
    assert.ok(cssFilterRule != null);
    assert.notOk(cssFilterRule.isInjectRule);
    assert.notOk(cssFilterRule.whiteListRule);
    assert.equal(selector, cssFilterRule.cssSelector);

    selector = ".todaystripe::after";
    ruleText = "w3schools.com##" + selector;
    cssFilterRule = new adguard.rules.CssFilterRule(ruleText);
    assert.ok(cssFilterRule != null);
    assert.notOk(cssFilterRule.isInjectRule);
    assert.notOk(cssFilterRule.whiteListRule);
    assert.equal(selector, cssFilterRule.cssSelector);

    selector = ".todaystripe:matches-css(display: block)";
    ruleText = "w3schools.com##" + selector;
    cssFilterRule = new adguard.rules.CssFilterRule(ruleText);
    assert.ok(cssFilterRule != null);
    assert.notOk(cssFilterRule.isInjectRule);
    assert.notOk(cssFilterRule.whiteListRule);
    assert.equal(selector, cssFilterRule.cssSelector);

    selector = ".todaystripe:matches-css-before(display: block)";
    ruleText = "w3schools.com##" + selector;
    cssFilterRule = new adguard.rules.CssFilterRule(ruleText);
    assert.ok(cssFilterRule != null);
    assert.notOk(cssFilterRule.isInjectRule);
    assert.notOk(cssFilterRule.whiteListRule);
    assert.equal(selector, cssFilterRule.cssSelector);

    selector = ".todaystripe:matches-css-after(display: block)";
    ruleText = "w3schools.com##" + selector;
    cssFilterRule = new adguard.rules.CssFilterRule(ruleText);
    assert.ok(cssFilterRule != null);
    assert.notOk(cssFilterRule.isInjectRule);
    assert.notOk(cssFilterRule.whiteListRule);
    assert.equal(selector, cssFilterRule.cssSelector);

    selector = ".todaystripe:has(.banner)";
    ruleText = "w3schools.com##" + selector;
    cssFilterRule = new adguard.rules.CssFilterRule(ruleText);
    assert.ok(cssFilterRule != null);
    assert.notOk(cssFilterRule.isInjectRule);
    assert.notOk(cssFilterRule.whiteListRule);
    assert.equal(selector, cssFilterRule.cssSelector);

    selector = ".todaystripe:contains(test)";
    ruleText = "w3schools.com##" + selector;
    cssFilterRule = new adguard.rules.CssFilterRule(ruleText);
    assert.ok(cssFilterRule != null);
    assert.notOk(cssFilterRule.isInjectRule);
    assert.notOk(cssFilterRule.whiteListRule);
    assert.equal(selector, cssFilterRule.cssSelector);
});

QUnit.test("Filter Rule With Colon", function (assert) {
    var selector = "a[href^=\"https://w3schools.com\"]";
    var ruleText = "w3schools.com##" + selector;
    var cssFilterRule = new adguard.rules.CssFilterRule(ruleText);
    assert.ok(cssFilterRule != null);
    assert.notOk(cssFilterRule.isInjectRule);
    assert.notOk(cssFilterRule.whiteListRule);
    assert.equal(selector, cssFilterRule.cssSelector);

    selector = "#Meebo\\:AdElement\\.Root";
    ruleText = "w3schools.com##" + selector;
    cssFilterRule = new adguard.rules.CssFilterRule(ruleText);
    assert.ok(cssFilterRule != null);
    assert.notOk(cssFilterRule.isInjectRule);
    assert.notOk(cssFilterRule.whiteListRule);
    assert.equal(selector, cssFilterRule.cssSelector);
});

QUnit.test("Invalid Pseudo Class", function (assert) {
    try {
        var ruleText = "yandex.ru##test:matches(.whatisthis)";
        new adguard.rules.CssFilterRule(ruleText);
        throw new Error("Rule should not be parsed successfully");
    } catch (ex) {
        assert.equal(ex.message, 'Unknown pseudo class: test:matches(.whatisthis)');
    }
});

QUnit.test("Extended Css Rules", function (assert) {
    var selector, ruleText, cssFilterRule;

    // :contains
    selector = ".todaystripe:contains(test)";
    ruleText = "w3schools.com##" + selector;
    cssFilterRule = new adguard.rules.CssFilterRule(ruleText);
    assert.ok(cssFilterRule);
    assert.ok(cssFilterRule.extendedCss);
    assert.notOk(cssFilterRule.isInjectRule);
    assert.notOk(cssFilterRule.whiteListRule);
    assert.equal(selector, cssFilterRule.cssSelector);

    selector = ".todaystripe[-ext-contains=\"test\"]";
    ruleText = "w3schools.com##" + selector;
    cssFilterRule = new adguard.rules.CssFilterRule(ruleText);
    assert.ok(cssFilterRule);
    assert.ok(cssFilterRule.extendedCss);
    assert.notOk(cssFilterRule.isInjectRule);
    assert.notOk(cssFilterRule.whiteListRule);
    assert.equal(selector, cssFilterRule.cssSelector);

    // :has
    selector = ".todaystripe:has(.banner)";
    ruleText = "w3schools.com##" + selector;
    cssFilterRule = new adguard.rules.CssFilterRule(ruleText);
    assert.ok(cssFilterRule);
    assert.ok(cssFilterRule.extendedCss);
    assert.notOk(cssFilterRule.isInjectRule);
    assert.notOk(cssFilterRule.whiteListRule);
    assert.equal(selector, cssFilterRule.cssSelector);

    selector = ".todaystripe[-ext-has=\".banner\"]";
    ruleText = "w3schools.com##" + selector;
    cssFilterRule = new adguard.rules.CssFilterRule(ruleText);
    assert.ok(cssFilterRule);
    assert.ok(cssFilterRule.extendedCss);
    assert.notOk(cssFilterRule.isInjectRule);
    assert.notOk(cssFilterRule.whiteListRule);
    assert.equal(selector, cssFilterRule.cssSelector);

    // :matches-css
    selector = ".todaystripe:matches-css(display: block)";
    ruleText = "w3schools.com##" + selector;
    cssFilterRule = new adguard.rules.CssFilterRule(ruleText);
    assert.ok(cssFilterRule);
    assert.ok(cssFilterRule.extendedCss);
    assert.notOk(cssFilterRule.isInjectRule);
    assert.notOk(cssFilterRule.whiteListRule);
    assert.equal(selector, cssFilterRule.cssSelector);

    selector = ".todaystripe[-ext-matches-css=\"display: block\"]";
    ruleText = "w3schools.com##" + selector;
    cssFilterRule = new adguard.rules.CssFilterRule(ruleText);
    assert.ok(cssFilterRule);
    assert.ok(cssFilterRule.extendedCss);
    assert.notOk(cssFilterRule.isInjectRule);
    assert.notOk(cssFilterRule.whiteListRule);
    assert.equal(selector, cssFilterRule.cssSelector);

    // :matches-css-before
    selector = ".todaystripe:matches-css-before(display: block)";
    ruleText = "w3schools.com##" + selector;
    cssFilterRule = new adguard.rules.CssFilterRule(ruleText);
    assert.ok(cssFilterRule);
    assert.ok(cssFilterRule.extendedCss);
    assert.notOk(cssFilterRule.isInjectRule);
    assert.notOk(cssFilterRule.whiteListRule);
    assert.equal(selector, cssFilterRule.cssSelector);

    selector = ".todaystripe[-ext-matches-css-before=\"display: block\"]";
    ruleText = "w3schools.com##" + selector;
    cssFilterRule = new adguard.rules.CssFilterRule(ruleText);
    assert.ok(cssFilterRule);
    assert.ok(cssFilterRule.extendedCss);
    assert.notOk(cssFilterRule.isInjectRule);
    assert.notOk(cssFilterRule.whiteListRule);
    assert.equal(selector, cssFilterRule.cssSelector);

    // :matches-css-after
    selector = ".todaystripe:matches-css-after(display: block)";
    ruleText = "w3schools.com##" + selector;
    cssFilterRule = new adguard.rules.CssFilterRule(ruleText);
    assert.ok(cssFilterRule);
    assert.ok(cssFilterRule.extendedCss);
    assert.notOk(cssFilterRule.isInjectRule);
    assert.notOk(cssFilterRule.whiteListRule);
    assert.equal(selector, cssFilterRule.cssSelector);

    selector = ".todaystripe[-ext-matches-css-after=\"display: block\"]";
    ruleText = "w3schools.com##" + selector;
    cssFilterRule = new adguard.rules.CssFilterRule(ruleText);
    assert.ok(cssFilterRule);
    assert.ok(cssFilterRule.extendedCss);
    assert.notOk(cssFilterRule.isInjectRule);
    assert.notOk(cssFilterRule.whiteListRule);
    assert.equal(selector, cssFilterRule.cssSelector);
});

QUnit.test("Extended Css Build", function (assert) {
    var rule = new adguard.rules.CssFilterRule("adguard.com##.sponsored");
    var genericRule = new adguard.rules.CssFilterRule("##.banner");
    var extendedCssRule = new adguard.rules.CssFilterRule("adguard.com##.sponsored[-ext-contains=test]");
    var filter = new adguard.rules.CssFilter([rule, genericRule, extendedCssRule]);

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

QUnit.test("Extended Css Build Common Extended", function (assert) {
    var rule = new adguard.rules.CssFilterRule("adguard.com##.sponsored");
    var genericRule = new adguard.rules.CssFilterRule("##.banner");
    var extendedCssRule = new adguard.rules.CssFilterRule("##.sponsored[-ext-contains=test]");
    var filter = new adguard.rules.CssFilter([rule, genericRule, extendedCssRule]);

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
    assert.equal(extendedCss.length, 0);
});

QUnit.test("Extended Css Build CssHits", function (assert) {

    var shadowDomPrefix = adguard.utils.browser.isShadowDomSupported() ? "::content " : "";

    var rule = new adguard.rules.CssFilterRule("adguard.com##.sponsored", 1);
    var genericRule = new adguard.rules.CssFilterRule("##.banner", 2);
    var extendedCssRule = new adguard.rules.CssFilterRule("adguard.com##.sponsored[-ext-contains=test]", 1);
    var filter = new adguard.rules.CssFilter([rule, genericRule, extendedCssRule]);

    var selectors, css, extendedCss, commonCss;

    selectors = filter.buildCssHits("adguard.com");
    css = selectors.css;
    extendedCss = selectors.extendedCss;
    commonCss = filter.buildCssHits(null).css;
    assert.equal(commonCss.length, 1);
    assert.equal(commonCss[0].trim(), shadowDomPrefix + ".banner { display: none!important; content: 'adguard2%3B%23%23.banner' !important;}");
    assert.equal(css.length, 2);
    assert.equal(css[0].trim(), shadowDomPrefix + ".banner { display: none!important; content: 'adguard2%3B%23%23.banner' !important;}");
    assert.equal(css[1].trim(), shadowDomPrefix + ".sponsored { display: none!important; content: 'adguard1%3Badguard.com%23%23.sponsored' !important;}");
    assert.equal(extendedCss.length, 1);
    assert.equal(extendedCss[0].trim(), ".sponsored[-ext-contains=test] { display: none!important; content: 'adguard1%3Badguard.com%23%23.sponsored%5B-ext-contains%3Dtest%5D' !important;}");

    selectors = filter.buildCssHits("adguard.com", true);
    css = selectors.css;
    extendedCss = selectors.extendedCss;
    commonCss = filter.buildCssHits(null).css;
    assert.equal(commonCss.length, 1);
    assert.equal(commonCss[0].trim(), shadowDomPrefix + ".banner { display: none!important; content: 'adguard2%3B%23%23.banner' !important;}");
    assert.equal(css.length, 1);
    assert.equal(css[0].trim(), shadowDomPrefix + ".sponsored { display: none!important; content: 'adguard1%3Badguard.com%23%23.sponsored' !important;}");
    assert.equal(extendedCss.length, 1);
    assert.equal(extendedCss[0].trim(), ".sponsored[-ext-contains=test] { display: none!important; content: 'adguard1%3Badguard.com%23%23.sponsored%5B-ext-contains%3Dtest%5D' !important;}");

});

QUnit.test("Extended Css Build Inject Css", function (assert) {
    var rule = new adguard.rules.CssFilterRule("adguard.com##.sponsored");
    var genericRule = new adguard.rules.CssFilterRule("##.banner");
    var extendedCssRule = new adguard.rules.CssFilterRule("adguard.com##.sponsored[-ext-contains=test]");
    var filter = new adguard.rules.CssFilter([rule, genericRule, extendedCssRule]);

    var selectors, css, extendedCss, commonCss;

    var injectRule = new adguard.rules.CssFilterRule('adguard.com##body:style(background:inherit;)');
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

    var exceptionInjectRule = new adguard.rules.CssFilterRule('adguard.com#@$#.sponsored { display: none!important;}');
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

QUnit.test("Extended Css Selector Inject Rule", function (assert) {
    var rule = new adguard.rules.CssFilterRule("adguard.com##.bannerSponsor");
    var genericRule = new adguard.rules.CssFilterRule("##.banner");
    var extendedCssRule = new adguard.rules.CssFilterRule("adguard.com##.sponsored[-ext-contains=test]");
    var filter = new adguard.rules.CssFilter([rule, genericRule, extendedCssRule]);

    var selectors, css, extendedCss, commonCss;

    var injectRule = new adguard.rules.CssFilterRule('adguard.com#$#.first-item h2:has(time) { font-size: 128px; })');
    assert.ok(injectRule.isInjectRule);
    assert.ok(injectRule.extendedCss);
    filter.addRule(injectRule);

    selectors = filter.buildInjectCss("adguard.com");
    css = selectors.css;
    extendedCss = selectors.extendedCss;
    commonCss = filter.buildCss(null).css;
    assert.equal(commonCss.length, 1);
    assert.equal(css.length, 0);
    assert.equal(extendedCss.length, 2);

    selectors = filter.buildInjectCss("adguard.com", true);
    css = selectors.css;
    extendedCss = selectors.extendedCss;
    commonCss = filter.buildCss(null).css;
    assert.equal(commonCss.length, 1);
    assert.equal(css.length, 0);
    assert.equal(extendedCss.length, 2);
});

QUnit.test("Css Filter WWW Test", function (assert) {
    var ruleText = "www.google.com##body";
    var rule = new adguard.rules.CssFilterRule(ruleText);

    assert.ok(rule != null);
    assert.equal(rule.permittedDomain, 'google.com');
});

QUnit.test("Permitted/Restricted domains Test", function (assert) {
    var ruleText = "##body";
    var rule = new adguard.rules.CssFilterRule(ruleText);

    rule.setRestrictedDomains(['lenta.ru']);
    rule.setRestrictedDomains(['lenta.ru', 'google.com']);

    assert.ok(rule != null);
    assert.equal(rule.getRestrictedDomains()[0], 'lenta.ru');
    assert.equal(rule.getRestrictedDomains()[1], 'google.com');
});
