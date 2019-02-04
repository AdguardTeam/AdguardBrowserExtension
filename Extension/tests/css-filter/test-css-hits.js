var CssFilter = adguard.rules.CssFilter;

var genericHide = CssFilter.RETRIEVE_TRADITIONAL_CSS + CssFilter.RETRIEVE_EXTCSS + CssFilter.GENERIC_HIDE_APPLIED;

QUnit.test("Extended Css Build CssHits", function (assert) {
    var rule = new adguard.rules.CssFilterRule('adguard.com##.sponsored', 1);
    var genericRule = new adguard.rules.CssFilterRule('##.banner', 2);
    var extendedCssRule = new adguard.rules.CssFilterRule('adguard.com##.sponsored[-ext-contains=test]', 1);
    var ruleWithContentAttribute = new adguard.rules.CssFilterRule("adguard.com#$#.background {content: 'test'}", 1);
    var ruleWithContentInSelector = new adguard.rules.CssFilterRule('adguard.com#$#.bgcontent {display: none}', 1);
    var filter = new adguard.rules.CssFilter([
        rule,
        genericRule,
        extendedCssRule,
        ruleWithContentAttribute,
        ruleWithContentInSelector,
    ]);

    var selectors = filter.buildCssHits('adguard.com');
    var css = selectors.css;
    var extendedCss = selectors.extendedCss;
    var commonCss = filter.buildCssHits(null).css;
    assert.equal(commonCss.length, 1);
    assert.equal(commonCss[0].trim(), ".banner { display: none!important; content: 'adguard2%3B%23%23.banner' !important;}");
    assert.equal(css.length, 4);
    assert.equal(css[0].trim(), ".banner { display: none!important; content: 'adguard2%3B%23%23.banner' !important;}");
    assert.equal(css[1].trim(), ".bgcontent {display: none; content: 'adguard1%3Badguard.com%23%24%23.bgcontent%20%7Bdisplay%3A%20none%7D' !important;}");
    // adguard mark is not inserted in the rules with content attribute
    assert.equal(css[2].trim(), ".background {content: 'test'}");
    assert.equal(css[3].trim(), ".sponsored { display: none!important; content: 'adguard1%3Badguard.com%23%23.sponsored' !important;}");
    assert.equal(extendedCss.length, 1);
    assert.equal(extendedCss[0].trim(), ".sponsored[-ext-contains=test] { display: none!important; content: 'adguard1%3Badguard.com%23%23.sponsored%5B-ext-contains%3Dtest%5D' !important;}");

    selectors = filter.buildCssHits('adguard.com', genericHide);
    css = selectors.css;
    extendedCss = selectors.extendedCss;
    commonCss = filter.buildCssHits(null).css;
    assert.equal(commonCss.length, 1);
    assert.equal(commonCss[0].trim(), ".banner { display: none!important; content: 'adguard2%3B%23%23.banner' !important;}");
    assert.equal(css.length, 3);
    assert.equal(css[0].trim(), ".bgcontent {display: none; content: 'adguard1%3Badguard.com%23%24%23.bgcontent%20%7Bdisplay%3A%20none%7D' !important;}");
    // adguard mark is not inserted in the rules with content attribute
    assert.equal(css[1].trim(), ".background {content: 'test'}");
    assert.equal(css[2].trim(), ".sponsored { display: none!important; content: 'adguard1%3Badguard.com%23%23.sponsored' !important;}");
    assert.equal(extendedCss.length, 1);
    assert.equal(extendedCss[0].trim(), ".sponsored[-ext-contains=test] { display: none!important; content: 'adguard1%3Badguard.com%23%23.sponsored%5B-ext-contains%3Dtest%5D' !important;}");
});

// https://github.com/AdguardTeam/AdguardBrowserExtension/issues/1079
QUnit.test('Parsing of Extended Css rule with parenthesis', function (assert) {
    var elementWithParenthesisHtml = '<div class="withParenthesis" style="background: rgb(0, 0, 0)">element with parenthesis</div>';
    document.body.insertAdjacentHTML('beforeend', elementWithParenthesisHtml);

    var extendedCssRuleWithParenthesis = new adguard.rules.CssFilterRule('adguard.com#$#.withParenthesis:matches-css(background: rgb(0, 0, 0)) { display: none!important;}', 1);

    var filter = new adguard.rules.CssFilter([
        extendedCssRuleWithParenthesis,
    ]);

    var selectors = filter.buildCssHits('adguard.com');
    var extendedCss = selectors.extendedCss;
    // Apply extended css rules
    new ExtendedCss({ styleSheet: extendedCss.join('\n') }).apply();

    var elementWithParenthesis = document.querySelector('.withParenthesis');
    var styleOfElementWithParenthesis;
    if (elementWithParenthesis) {
        styleOfElementWithParenthesis = getComputedStyle(elementWithParenthesis);
    }
    assert.equal(styleOfElementWithParenthesis.display, 'none');

    elementWithParenthesis.remove();
});

QUnit.test('Count css hits', function (assert) {
    var rule = new adguard.rules.CssFilterRule('adguard.com##.sponsored', 1);
    var genericRule = new adguard.rules.CssFilterRule('adguard.com##.banner', 2);
    var extendedCssRule = new adguard.rules.CssFilterRule('adguard.com##.ads[-ext-contains="ads"]', 1);
    var ruleWithContentAttribute = new adguard.rules.CssFilterRule("adguard.com#$#.background {content: 'test'}", 1);
    var ruleWithContentInSelector = new adguard.rules.CssFilterRule('adguard.com#$#.bgcontent {display: none}', 1);
    var filter = new adguard.rules.CssFilter([
        rule,
        genericRule,
        extendedCssRule,
        ruleWithContentAttribute,
        ruleWithContentInSelector,
    ]);

    var selectors = filter.buildCssHits('adguard.com');

    var css = selectors.css;

    for (var i = 0; i < css.length; i += 1) {
        var styleEl = document.createElement('style');
        styleEl.setAttribute('type', 'text/css');
        styleEl.textContent = css[i];
        (document.head || document.documentElement).appendChild(styleEl);
    }

    var extendedCss = selectors.extendedCss;
    new ExtendedCss({ styleSheet: extendedCss.join('') }).apply();

    var done = assert.async();

    function setCssHitsFoundCallback(result) {
        assert.equal(result.length, 5);
        result.sort(function (s1, s2) {
            return s1.ruleText < s2.ruleText ? -1 : 1;
        });
        assert.equal(result[0].ruleText, 'adguard.com##.ads[-ext-contains="ads"]');
        assert.equal(result[0].filterId, 1);
        assert.equal(result[1].ruleText, 'adguard.com##.banner');
        assert.equal(result[1].filterId, 2);
        assert.equal(result[2].ruleText, 'adguard.com##.sponsored');
        assert.equal(result[2].filterId, 1);
        assert.equal(result[3].ruleText, 'adguard.com##.sponsored');
        assert.equal(result[3].filterId, 1);
        assert.equal(result[4].ruleText, 'adguard.com#$#.bgcontent {display: none}');
        assert.equal(result[4].filterId, 1);
        CssHitsCounter.stop();
        done();
    }
    CssHitsCounter.init(setCssHitsFoundCallback);
});


QUnit.test('Count css hits affected by extended css', function (assert) {
    const extendedCssRule = { text: 'adguard.com##.extended[-ext-contains="ads"]', filterId: 1 };

    const rules = [new adguard.rules.CssFilterRule(extendedCssRule.text, extendedCssRule.filterId)];

    const filter = new adguard.rules.CssFilter(rules);

    const selectors = filter.buildCssHits('adguard.com');

    const done = assert.async();

    const extendedCss = selectors.extendedCss;

    const beforeStyleApplied = (affectedElement) => {
        const parseResult = CssHitsCounter.parseExtendedStyleInfo(affectedElement.rule.style.content);
        assert.equal(parseResult.filterId, extendedCssRule.filterId);
        assert.equal(parseResult.ruleText, extendedCssRule.text);
        done();
        return affectedElement;
    };

    new ExtendedCss({
        styleSheet: extendedCss.join(''),
        beforeStyleApplied: beforeStyleApplied,
    }).apply();
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
