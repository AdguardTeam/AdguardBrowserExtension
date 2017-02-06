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

QUnit.test('Count css hits', function (assert) {

    var isShadowDomSupported = adguard.utils.browser.isShadowDomSupported();

    var shadowRoot = document.documentElement.shadowRoot;
    if (!shadowRoot) {
        if ("createShadowRoot" in document.documentElement) {
            shadowRoot = document.documentElement.createShadowRoot();
            shadowRoot.appendChild(document.createElement("shadow"));
        }
    }

    var rule = new adguard.rules.CssFilterRule("adguard.com##.sponsored", 1);
    var genericRule = new adguard.rules.CssFilterRule("adguard.com##.banner", 2);
    var extendedCssRule = new adguard.rules.CssFilterRule("adguard.com##.ads[-ext-contains=\"ads\"]", 1);
    var filter = new adguard.rules.CssFilter([rule, genericRule, extendedCssRule]);

    var selectors = filter.buildCssHits("adguard.com");

    var css = selectors.css;
    for (var i = 0; i < css.length; i++) {
        var styleEl = document.createElement("style");
        styleEl.setAttribute("type", "text/css");
        var cssContent = css[i];
        if (isShadowDomSupported && !shadowRoot) {
            cssContent = cssContent.replace(new RegExp('::content ', 'g'), '');
        }
        styleEl.textContent = cssContent;
        if (isShadowDomSupported && shadowRoot) {
            shadowRoot.appendChild(styleEl);
        } else {
            (document.head || document.documentElement).appendChild(styleEl);
        }
    }

    var extendedCss = selectors.extendedCss;
    new ExtendedCss(extendedCss.join("\n")).apply();

    var done = assert.async();

    CssHitsCounter.setCssHitsFoundCallback(function (result) {
        assert.equal(result.length, 4);
        result.sort(function (s1, s2) {
            return s1.ruleText < s2.ruleText ? -1 : 1;
        });
        assert.equal(result[0].ruleText, "adguard.com##.ads[-ext-contains=\"ads\"]");
        assert.equal(result[0].filterId, 1);
        assert.equal(result[1].ruleText, "adguard.com##.banner");
        assert.equal(result[1].filterId, 2);
        assert.equal(result[2].ruleText, "adguard.com##.sponsored");
        assert.equal(result[2].filterId, 1);
        assert.equal(result[3].ruleText, "adguard.com##.sponsored");
        assert.equal(result[3].filterId, 1);
        done();
    });
    CssHitsCounter.count();
});

QUnit.test('Save css hits', function (assert) {

    var result = [];
    result.push({
        ruleText: "adguard.com##.ads[-ext-contains=\"ads\"]",
        filterId: 1
    });
    result.push({
        ruleText: "adguard.com##.banner",
        filterId: 2
    });
    result.push({
        ruleText: "adguard.com##.sponsored",
        filterId: 1
    });
    result.push({
        ruleText: "adguard.com##.sponsored",
        filterId: 1
    });

    window.localStorage.clear();

    adguard.hitStats.addDomainView('adguard.com');

    for (var i = 0; i < result.length; i++) {
        var stat = result[i];
        adguard.hitStats.addRuleHit('adguard.com', stat.ruleText, stat.filterId);
    }

    var stats = adguard.hitStats.getStats();
    assert.equal(stats.views, 1);
    assert.ok(!!stats.domains['adguard.com']);
    assert.equal(stats.domains['adguard.com'].views, 1);
    assert.equal(stats.domains['adguard.com'].rules['1']["adguard.com##.ads[-ext-contains=\"ads\"]"].h, 1);
    assert.equal(stats.domains['adguard.com'].rules['1']["adguard.com##.sponsored"].h, 2);
    assert.equal(stats.domains['adguard.com'].rules['2']["adguard.com##.banner"].h, 1);

});