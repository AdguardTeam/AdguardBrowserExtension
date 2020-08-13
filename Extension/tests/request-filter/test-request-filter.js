/* eslint-disable no-console,no-undef */
/* global QUnit, adguard, StringRuleList, CosmeticOption */

adguard.webRequestService = adguard.webRequestService || {
    isCollectingCosmeticRulesHits: () => false,
};

const createRequestFilter = async (rulesText) => {
    const lists = [new StringRuleList(1, rulesText, false, false)];
    await adguard.engine.startEngine(lists);
    return new adguard.RequestFilter();
};

const createRequestFilterWithRules = rules => createRequestFilter(rules.join('\n'));

QUnit.test('General', async (assert) => {
    const url = 'https://test.com/';
    const referrer = 'example.org';
    const ruleText = '||test.com^';

    const requestFilter = await createRequestFilter(ruleText);

    const result = requestFilter.findRuleForRequest(url, referrer, adguard.RequestTypes.SUBDOCUMENT);
    assert.ok(result != null);
    assert.equal(result.getText(), ruleText);
});

QUnit.test('RequestFilter.findRuleForRequest performance', async (assert) => {
    setLogger({
        error() {},
        warn() {},
        log() {},
        info() {},
    });

    // eslint-disable-next-line no-undef
    const requestFilter = await createRequestFilter(filtersFromTxt.join('\n'));

    const url = 'https://www.youtube.com/gaming';
    const referrer = 'http://example.org';

    const count = 50000;
    const startTime = new Date().getTime();
    for (let k = 0; k < count; k += 1) {
        requestFilter.findRuleForRequest(url, referrer, adguard.RequestTypes.SUBDOCUMENT);
    }

    const elapsed = new Date().getTime() - startTime;
    assert.ok(elapsed > 0);

    console.log('------------------------------------START TEST PERFORMANCE-----------------------------------');
    console.log(`Total: ${elapsed} ms`);
    console.log(`Average: ${elapsed / count} ms`);
    console.log('------------------------------------END TEST PERFORMANCE-----------------------------------');

    // Total: 84 ms
    // Average: 0.00168 ms

    setLogger(console);
});

QUnit.test('Whitelist rules selecting', async (assert) => {
    const { RequestTypes } = adguard;

    const url = 'https://test.com/';
    const referrer = 'http://example.org';

    const rule = '||test.com^';
    const whitelist = '@@||test.com^';
    const documentRule = '@@||test.com^$document';
    const genericHideRule = '@@||test.com^$generichide';

    let requestFilter;
    let result;

    requestFilter = await createRequestFilterWithRules([rule]);
    result = requestFilter.findRuleForRequest(url, referrer, RequestTypes.SUBDOCUMENT);
    assert.ok(result != null);
    assert.equal(result.getText(), rule);

    requestFilter = await createRequestFilterWithRules([rule, whitelist]);
    result = requestFilter.findRuleForRequest(url, referrer, RequestTypes.SUBDOCUMENT);
    assert.ok(result != null);
    assert.equal(result.getText(), whitelist);

    requestFilter = await createRequestFilterWithRules([rule, documentRule]);
    result = requestFilter.findRuleForRequest(url, referrer, RequestTypes.DOCUMENT);
    assert.ok(result != null);
    assert.equal(result.ruleText, documentRule);

    requestFilter = await createRequestFilterWithRules([rule, whitelist, genericHideRule]);
    result = requestFilter.findRuleForRequest(url, referrer, RequestTypes.DOCUMENT);
    assert.ok(result != null);
    assert.equal(result.getText(), genericHideRule);
});

QUnit.test('Important modifier rules', async (assert) => {
    const { RequestTypes } = adguard;

    const url = 'https://test.com/';
    const referrer = 'http://example.org';

    const rule = '||test.com^';
    const whitelist = '@@||test.com^';
    const important = '||test.com^$important';

    let requestFilter;
    let result;

    requestFilter = await createRequestFilterWithRules([rule]);
    result = requestFilter.findRuleForRequest(url, referrer, RequestTypes.SUBDOCUMENT);
    assert.ok(result != null);
    assert.equal(result.getText(), rule);

    requestFilter = await createRequestFilterWithRules([rule, whitelist]);
    result = requestFilter.findRuleForRequest(url, referrer, RequestTypes.SUBDOCUMENT);
    assert.ok(result != null);
    assert.equal(result.getText(), whitelist);

    requestFilter = await createRequestFilterWithRules([rule, whitelist, important]);
    result = requestFilter.findRuleForRequest(url, referrer, RequestTypes.SUBDOCUMENT);
    assert.ok(result != null);
    assert.equal(result.getText(), important);
});

QUnit.test('Cookie rules', async (assert) => {
    const ruleText = '||xpanama.net^$third-party,cookie=c_user,domain=~example.org|merriam-webster.com';
    const requestFilter = await createRequestFilterWithRules([ruleText]);

    const rules = requestFilter.findCookieRules(
        'https://nop.xpanama.net/if.html?adflag=1&cb=kq4iOggNyP',
        'https://www.merriam-webster.com/',
        adguard.RequestTypes.DOCUMENT
    );

    assert.ok(rules.length === 1);
    assert.equal(rules[0].getText(), ruleText);
});

QUnit.test('Redirect rules', async (assert) => {
    const rawYaml = `
        - title: 1x1-transparent.gif
          aliases:
            - 1x1-transparent-gif
          comment: 'http://probablyprogramming.com/2009/03/15/the-tiniest-gif-ever'
          contentType: image/gif;base64
          content: R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==

        - title: noopjs
          aliases:
            - blank-js
          contentType: application/javascript
          content: (function() {})()`;

    adguard.redirectFilterService.setRedirectSources(rawYaml);

    const redirectRule = 'example.org/ads.js$script,redirect=noopjs';
    const blockRedirectRule = '||example.org/*.png$image,redirect=1x1-transparent.gif';

    const requestFilter = await createRequestFilterWithRules([redirectRule, blockRedirectRule]);

    const rule = requestFilter.findRuleForRequest(
        'http://example.org/ads.js', 'http://example.org/', adguard.RequestTypes.SCRIPT
    );
    assert.ok(rule != null);
    assert.equal(rule.getText(), redirectRule);

    const imgRule = requestFilter.findRuleForRequest(
        'http://example.org/ad.png', 'http://example.org/', adguard.RequestTypes.IMAGE
    );
    assert.ok(imgRule != null);
    assert.equal(imgRule.getText(), blockRedirectRule);
});

QUnit.module('$badfilter');

QUnit.test('BadFilter option', async (assert) => {
    const rule = 'https:*_ad_';
    const ruleTwo = 'https:*_da_';
    const ruleThree = 'https:*_ad_$match-case';
    const badFilterRule = 'https:*_ad_$badfilter';

    const comAd = 'https://google.com/_ad_agency';
    const comDa = 'https://google.com/_da_agency';

    let requestFilter;

    requestFilter = await createRequestFilterWithRules([
        rule,
        ruleTwo,
    ]);
    assert.ok(requestFilter.findRuleForRequest(comAd, '', adguard.RequestTypes.SUBDOCUMENT));
    assert.ok(requestFilter.findRuleForRequest(comDa, '', adguard.RequestTypes.SUBDOCUMENT));

    requestFilter = await createRequestFilterWithRules([
        rule,
        ruleTwo,
        badFilterRule,
    ]);
    assert.notOk(requestFilter.findRuleForRequest(comAd, '', adguard.RequestTypes.SUBDOCUMENT));
    assert.ok(requestFilter.findRuleForRequest(comDa, '', adguard.RequestTypes.SUBDOCUMENT));

    requestFilter = await createRequestFilterWithRules([
        ruleTwo,
        ruleThree,
        badFilterRule,
    ]);
    assert.ok(requestFilter.findRuleForRequest(comAd, '', adguard.RequestTypes.SUBDOCUMENT));
    assert.ok(requestFilter.findRuleForRequest(comDa, '', adguard.RequestTypes.SUBDOCUMENT));

    requestFilter = await createRequestFilterWithRules([
        ruleTwo,
        ruleThree,

    ]);
    assert.ok(requestFilter.findRuleForRequest(comAd, '', adguard.RequestTypes.SUBDOCUMENT));
    assert.ok(requestFilter.findRuleForRequest(comDa, '', adguard.RequestTypes.SUBDOCUMENT));

    requestFilter = await createRequestFilterWithRules([
        ruleTwo,
    ]);
    assert.notOk(requestFilter.findRuleForRequest(comAd, '', adguard.RequestTypes.SUBDOCUMENT));
    assert.ok(requestFilter.findRuleForRequest(comDa, '', adguard.RequestTypes.SUBDOCUMENT));
});

QUnit.test('BadFilter option whitelist', async (assert) => {
    const url = 'https://test.com/';
    const referrer = 'http://example.org';

    const rule = '||test.com^';
    const whitelist = '@@||test.com^';
    const badFilterRule = '@@||test.com^$badfilter';

    let requestFilter;
    let result;

    requestFilter = await createRequestFilterWithRules([
        rule,
    ]);

    result = requestFilter.findRuleForRequest(url, referrer, adguard.RequestTypes.SUBDOCUMENT);
    assert.ok(result);
    assert.equal(result.getText(), rule);


    requestFilter = await createRequestFilterWithRules([
        rule, whitelist,
    ]);

    result = requestFilter.findWhiteListRule(url, referrer, adguard.RequestTypes.SUBDOCUMENT);
    assert.ok(result);
    assert.equal(result.getText(), whitelist);

    result = requestFilter.findRuleForRequest(url, referrer, adguard.RequestTypes.SUBDOCUMENT);
    assert.ok(result);
    assert.equal(result.getText(), whitelist);

    requestFilter = await createRequestFilterWithRules([
        rule, whitelist, badFilterRule,
    ]);

    result = requestFilter.findWhiteListRule(url, referrer, adguard.RequestTypes.SUBDOCUMENT);
    assert.notOk(result);

    result = requestFilter.findRuleForRequest(url, referrer, adguard.RequestTypes.SUBDOCUMENT);
    assert.ok(result);
    assert.equal(result.getText(), rule);
});

QUnit.test('BadFilter multi-options', async (assert) => {
    const rule = '||example.org^$object';
    const ruleTwo = '||example.org^';
    const badFilterRule = '||example.org^$badfilter,object';
    const badFilterRuleInv = '||example.org^$object,badfilter';

    const testUrl = 'https://example.org';

    let requestFilter;

    requestFilter = await createRequestFilterWithRules([
        rule, ruleTwo,
    ]);
    assert.ok(requestFilter.findRuleForRequest(testUrl, '', adguard.RequestTypes.OBJECT));
    assert.ok(requestFilter.findRuleForRequest(testUrl, '', adguard.RequestTypes.SUBDOCUMENT));

    requestFilter = await createRequestFilterWithRules([
        rule, ruleTwo, badFilterRule,
    ]);

    assert.ok(requestFilter.findRuleForRequest(testUrl, '', adguard.RequestTypes.OBJECT));
    assert.ok(requestFilter.findRuleForRequest(testUrl, '', adguard.RequestTypes.SUBDOCUMENT));
    assert.equal(ruleTwo, requestFilter.findRuleForRequest(testUrl, '', adguard.RequestTypes.OBJECT).getText());
    assert.equal(ruleTwo, requestFilter.findRuleForRequest(testUrl, '', adguard.RequestTypes.SUBDOCUMENT).getText());

    requestFilter = await createRequestFilterWithRules([
        rule, ruleTwo, badFilterRuleInv,
    ]);
    assert.ok(requestFilter.findRuleForRequest(testUrl, '', adguard.RequestTypes.OBJECT));
    assert.ok(requestFilter.findRuleForRequest(testUrl, '', adguard.RequestTypes.SUBDOCUMENT));
    assert.equal(ruleTwo, requestFilter.findRuleForRequest(testUrl, '', adguard.RequestTypes.OBJECT).getText());
    assert.equal(ruleTwo, requestFilter.findRuleForRequest(testUrl, '', adguard.RequestTypes.SUBDOCUMENT).getText());
});

QUnit.test('BadFilter doesn stop looking for other rules', async (assert) => {
    const rule = '||example.org^$third-party';
    const ruleTwo = '||example.org^$xmlhttprequest';
    const badFilterRule = '||example.org^$third-party,badfilter';
    const badFilterRuleHttp = '||example.org^$xmlhttprequest,badfilter';

    const testUrl = 'https://example.org';
    const documentUrl = 'https://third-party.com';

    let requestFilter;

    requestFilter = await createRequestFilterWithRules([
        rule, ruleTwo,
    ]);

    assert.ok(requestFilter.findRuleForRequest(testUrl, documentUrl, adguard.RequestTypes.DOCUMENT));
    assert.ok(requestFilter.findRuleForRequest(testUrl, '', adguard.RequestTypes.XMLHTTPREQUEST));

    requestFilter = await createRequestFilterWithRules([
        rule, ruleTwo, badFilterRule,
    ]);
    assert.notOk(requestFilter.findRuleForRequest(testUrl, documentUrl, adguard.RequestTypes.DOCUMENT));
    assert.ok(requestFilter.findRuleForRequest(testUrl, '', adguard.RequestTypes.XMLHTTPREQUEST));

    requestFilter = await createRequestFilterWithRules([
        rule, ruleTwo, badFilterRuleHttp,
    ]);

    assert.ok(requestFilter.findRuleForRequest(testUrl, documentUrl, adguard.RequestTypes.DOCUMENT));
    assert.notOk(requestFilter.findRuleForRequest(testUrl, '', adguard.RequestTypes.XMLHTTPREQUEST));
});

QUnit.module('$csp');

QUnit.test('CSP rules', async (assert) => {
    let requestFilter;
    let result;

    const cspRule = '||xpanama.net^$third-party,csp=connect-src \'none\',domain=~example.org|merriam-webster.com';
    requestFilter = await createRequestFilterWithRules([cspRule]);
    result = requestFilter.findCspRules(
        'https://nop.xpanama.net/if.html?adflag=1&cb=kq4iOggNyP',
        'https://www.merriam-webster.com/',
        adguard.RequestTypes.DOCUMENT
    );
    assert.ok(result.length === 1);
    assert.equal(result[0].getText(), cspRule);

    result = requestFilter.findCspRules(
        'https://xpanama.net',
        'https://example.org',
        adguard.RequestTypes.DOCUMENT
    );
    assert.ok(!result || result.length === 0);

    // Add matching directive whitelist rule
    const directiveWhiteListRule = '@@||xpanama.net^$csp=connect-src \'none\'';
    requestFilter = await createRequestFilterWithRules([cspRule, directiveWhiteListRule]);
    result = requestFilter.findCspRules(
        'https://xpanama.net',
        'https://www.merriam-webster.com/',
        adguard.RequestTypes.DOCUMENT
    );
    // Specific whitelist rule should be returned
    assert.ok(result.length === 1);
    assert.equal(result[0].getText(), directiveWhiteListRule);

    // Add global whitelist rule
    const globalWhiteListRule = '@@||xpanama.net^$csp';
    requestFilter = await createRequestFilterWithRules([cspRule, directiveWhiteListRule, globalWhiteListRule]);
    result = requestFilter.findCspRules(
        'https://xpanama.net', 'https://www.merriam-webster.com/', adguard.RequestTypes.DOCUMENT
    );
    // Global whitelist rule should be returned
    assert.ok(result.length === 1);
    assert.equal(result[0].getText(), globalWhiteListRule);

    // Add whitelist rule, but with not matched directive
    const directiveMissWhiteListRule = '@@||xpanama.net^$csp=frame-src \'none\'';
    requestFilter = await createRequestFilterWithRules([cspRule, directiveMissWhiteListRule]);
    result = requestFilter.findCspRules(
        'https://xpanama.net', 'https://www.merriam-webster.com/', adguard.RequestTypes.DOCUMENT
    );
    assert.ok(result.length === 1);
    assert.equal(result[0].getText(), cspRule);

    // Add CSP rule with duplicated directive
    const duplicateCspRule = '||xpanama.net^$third-party,csp=connect-src \'none\'';
    requestFilter = await createRequestFilterWithRules([cspRule, directiveMissWhiteListRule, duplicateCspRule]);
    result = requestFilter.findCspRules(
        'https://xpanama.net', 'https://www.merriam-webster.com/', adguard.RequestTypes.DOCUMENT
    );
    assert.ok(result.length === 1);
    assert.ok(result[0].getText() === cspRule || result[0].getText() === duplicateCspRule);

    // Test request type matching
    const cspRuleSubDocument = '||xpanama.net^$csp=connect-src http:,domain=merriam-webster.com,subdocument';
    const cspRuleNotSubDocument = '||xpanama.net^$csp=connect-src \'none\',domain=merriam-webster.com,~subdocument';
    const cspRuleAny = '||xpanama.net^$csp=frame-src \'none\',domain=merriam-webster.com';
    requestFilter = await createRequestFilterWithRules([cspRuleSubDocument, cspRuleNotSubDocument, cspRuleAny]);

    result = requestFilter.findCspRules(
        'https://nop.xpanama.net/if.html?adflag=1&cb=kq4iOggNyP',
        'https://www.merriam-webster.com/',
        adguard.RequestTypes.DOCUMENT
    );
    assert.ok(result.length === 2);
    assert.ok(result[0].getText() === cspRuleAny || result[0].getText() === cspRuleNotSubDocument);
    assert.ok(result[1].getText() === cspRuleAny || result[1].getText() === cspRuleNotSubDocument);

    result = requestFilter.findCspRules(
        'https://nop.xpanama.net/if.html?adflag=1&cb=kq4iOggNyP',
        'https://www.merriam-webster.com/',
        adguard.RequestTypes.SUBDOCUMENT
    );
    assert.ok(result.length === 2);
    assert.ok(result[0].getText() === cspRuleAny || result[0].getText() === cspRuleSubDocument);
    assert.ok(result[1].getText() === cspRuleAny || result[1].getText() === cspRuleSubDocument);
});

QUnit.test('CSP important rules', async (assert) => {
    let requestFilter;
    let rules;

    // Test important rules
    const globalWhiteListRule = '@@||xpanama.net^$csp,domain=merriam-webster.com';
    const directiveWhiteListRule = '@@||xpanama.net^$csp=frame-src \'none\',domain=merriam-webster.com';
    // eslint-disable-next-line max-len
    const importantDirectiveWhiteListRule = '@@||xpanama.net^$csp=frame-src \'none\',domain=merriam-webster.com,important';
    const defaultCspRule = '||xpanama.net^$csp=frame-src \'none\',domain=merriam-webster.com';
    const importantCspRule = '||xpanama.net^$csp=frame-src \'none\',domain=merriam-webster.com,important';

    function checkCspRules(expected) {
        rules = requestFilter.findCspRules(
            'https://nop.xpanama.net/if.html?adflag=1&cb=kq4iOggNyP',
            'https://www.merriam-webster.com/', adguard.RequestTypes.DOCUMENT
        );
        assert.ok(rules.length === 1);
        assert.equal(rules[0].getText(), expected);
    }

    requestFilter = await createRequestFilterWithRules([
        globalWhiteListRule,
        directiveWhiteListRule,
        importantDirectiveWhiteListRule,
        defaultCspRule,
        importantCspRule,
    ]);

    checkCspRules(globalWhiteListRule);

    requestFilter = await createRequestFilterWithRules([
        directiveWhiteListRule,
        importantDirectiveWhiteListRule,
        defaultCspRule,
        importantCspRule,
    ]);
    checkCspRules(importantDirectiveWhiteListRule);

    requestFilter = await createRequestFilterWithRules([
        directiveWhiteListRule,
        defaultCspRule,
        importantCspRule,
    ]);
    checkCspRules(importantCspRule);

    requestFilter = await createRequestFilterWithRules([
        directiveWhiteListRule,
        defaultCspRule,
    ]);
    checkCspRules(directiveWhiteListRule);

    requestFilter = await createRequestFilterWithRules([
        defaultCspRule,
    ]);
    checkCspRules(defaultCspRule);
});

QUnit.test('CSP rules are found correctly', async (assert) => {
    /**
     * For example:
     * rule1 = '||$csp'
     * rule2 = '||$csp,subdocument'
     * rule3 = '||$csp,~subdocument'
     * findCspRules(adguard.RequestTypes.SUBDOCUMENT) = [rule1, rule2];
     * findCspRules(adguard.RequestTypes.DOCUMENT) = [rule1, rule3];
     */
    const url = 'https://example.org/blabla';

    const ruleText1 = '||example.org^$csp=default-src \'none\'';
    const ruleText2 = '||example.org^$csp=script-src \'none\',subdocument';
    const ruleText3 = '||example.org^$csp=connect-src \'none\',~subdocument';

    const requestFilter = await createRequestFilterWithRules([
        ruleText1, ruleText2, ruleText3,
    ]);

    const search1 = requestFilter.findCspRules(url, null, adguard.RequestTypes.SUBDOCUMENT);
    assert.ok(search1.length === 2);
    assert.equal(search1[0].getText(), ruleText1);
    assert.equal(search1[1].getText(), ruleText2);

    const search2 = requestFilter.findCspRules(url, null, adguard.RequestTypes.DOCUMENT);
    assert.ok(search2.length === 2);
    assert.equal(search2[0].getText(), ruleText1);
    assert.equal(search2[1].getText(), ruleText3);
});

QUnit.module('Stylesheets');

QUnit.test('Css Exception Rules', async (assert) => {
    const rule = '##.sponsored';
    const rule1 = 'adguard.com#@#.sponsored';

    const testUrl = 'http://adguard.com';

    let filter = await createRequestFilterWithRules([rule]);
    let { css } = filter.getSelectorsForUrl(testUrl, CosmeticOption.CosmeticOptionAll);
    assert.equal(css.length, 1);
    assert.equal(css[0].trim(), '.sponsored { display: none!important; }');

    filter = await createRequestFilterWithRules([rule, rule1]);
    css = filter.getSelectorsForUrl(testUrl, CosmeticOption.CosmeticOptionAll).css;
    assert.equal(css.length, 0);

    css = filter.getSelectorsForUrl('http://another.com', CosmeticOption.CosmeticOptionAll).css;
    assert.equal(css.length, 1);
    assert.equal(css[0].trim(), '.sponsored { display: none!important; }');
});

QUnit.test('Css GenericHide Exception Rules', async (assert) => {
    const genericOne = '##.generic-one';
    const genericTwo = '~google.com,~yahoo.com###generic';
    const nonGeneric = 'adguard.com##.non-generic';
    const exceptionRule = 'adguard.com#@#.generic-one';
    const genericHideRule = '@@||adguard.com^$generichide';
    const elemHideRule = '@@||adguard.com^$elemhide';

    const testUrl = 'http://adguard.com';
    const anOtherUrl = 'http://another.com';

    let filter;
    let css;

    filter = await createRequestFilterWithRules([genericOne]);
    css = filter.getSelectorsForUrl(testUrl, CosmeticOption.CosmeticOptionAll).css;
    assert.equal(css.length, 1);
    assert.equal(css[0].trim(), '.generic-one { display: none!important; }');

    filter = await createRequestFilterWithRules([genericOne, genericTwo]);
    css = filter.getSelectorsForUrl(testUrl, CosmeticOption.CosmeticOptionAll).css;
    assert.equal(css.length, 1);
    assert.equal(css[0].trim(), '.generic-one, #generic { display: none!important; }');

    filter = await createRequestFilterWithRules([genericOne, genericTwo, nonGeneric]);
    css = filter.getSelectorsForUrl(testUrl, CosmeticOption.CosmeticOptionAll).css;
    assert.equal(css.length, 1);
    assert.equal(css[0].trim(), '.generic-one, #generic, .non-generic { display: none!important; }');

    css = filter.getSelectorsForUrl(anOtherUrl, CosmeticOption.CosmeticOptionAll).css;
    assert.equal(css.length, 1);
    assert.equal(css[0].trim(), '.generic-one, #generic { display: none!important; }');

    filter = await createRequestFilterWithRules([genericOne, genericTwo, nonGeneric, exceptionRule]);
    css = filter.getSelectorsForUrl(testUrl, CosmeticOption.CosmeticOptionAll).css;
    assert.equal(css.length, 1);
    assert.equal(css[0].trim(), '#generic, .non-generic { display: none!important; }');

    css = filter.getSelectorsForUrl(anOtherUrl, CosmeticOption.CosmeticOptionAll).css;
    assert.equal(css.length, 1);
    assert.equal(css[0].trim(), '.generic-one, #generic { display: none!important; }');

    filter = await createRequestFilterWithRules([genericOne, genericTwo, nonGeneric, exceptionRule, genericHideRule]);
    css = filter.getSelectorsForUrl(testUrl, CosmeticOption.CosmeticOptionAll).css;
    assert.equal(css.length, 1);
    assert.equal(css[0].trim(), '#generic, .non-generic { display: none!important; }');
    css = filter.getSelectorsForUrl(testUrl, CosmeticOption.CosmeticOptionCSS).css;
    assert.equal(css.length, 1);
    assert.equal(css[0].trim(), '.non-generic { display: none!important; }');

    css = filter.getSelectorsForUrl(anOtherUrl, CosmeticOption.CosmeticOptionAll).css;
    assert.equal(css.length, 1);
    assert.equal(css[0].trim(), '.generic-one, #generic { display: none!important; }');
    css = filter.getSelectorsForUrl(anOtherUrl, CosmeticOption.CosmeticOptionCSS).css;
    assert.equal(css.length, 0);

    filter = await createRequestFilterWithRules([genericOne, genericTwo, nonGeneric, genericHideRule]);
    css = filter.getSelectorsForUrl(testUrl, CosmeticOption.CosmeticOptionAll).css;
    assert.equal(css.length, 1);
    assert.equal(css[0].trim(), '.generic-one, #generic, .non-generic { display: none!important; }');
    css = filter.getSelectorsForUrl(testUrl, CosmeticOption.CosmeticOptionCSS).css;
    assert.equal(css.length, 1);
    assert.equal(css[0].trim(), '.non-generic { display: none!important; }');

    css = filter.getSelectorsForUrl(anOtherUrl, CosmeticOption.CosmeticOptionAll).css;
    assert.equal(css.length, 1);
    assert.equal(css[0].trim(), '.generic-one, #generic { display: none!important; }');
    css = filter.getSelectorsForUrl(anOtherUrl, CosmeticOption.CosmeticOptionCSS).css;
    assert.equal(css.length, 0);

    filter = await createRequestFilterWithRules([genericOne, genericTwo, nonGeneric, genericHideRule, elemHideRule]);
    css = filter.getSelectorsForUrl(testUrl, CosmeticOption.CosmeticOptionAll).css;
    assert.equal(css.length, 1);
    assert.equal(css[0].trim(), '.generic-one, #generic, .non-generic { display: none!important; }');
    css = filter.getSelectorsForUrl(testUrl, CosmeticOption.CosmeticOptionCSS).css;
    assert.equal(css.length, 1);
    assert.equal(css[0].trim(), '.non-generic { display: none!important; }');

    css = filter.getSelectorsForUrl(anOtherUrl, CosmeticOption.CosmeticOptionAll).css;
    assert.equal(css.length, 1);
    assert.equal(css[0].trim(), '.generic-one, #generic { display: none!important; }');
    css = filter.getSelectorsForUrl(anOtherUrl, CosmeticOption.CosmeticOptionCSS).css;
    assert.equal(css.length, 0);
});

QUnit.module('Misc');

QUnit.test('$document modifier', async (assert) => {
    const rule = '||example.org^$document';

    const requestFilter = await createRequestFilterWithRules([rule]);
    assert.ok(requestFilter.findRuleForRequest(
        'https://example.org',
        'https://example.org',
        adguard.RequestTypes.DOCUMENT
    ));
});

QUnit.test('Domain restriction semantic', async (assert) => {
    const url = 'https://example.org/';

    const cspRule = '$domain=example.org,csp=script-src \'none\'';
    const cookieRule = '$cookie=test,domain=example.org';

    const requestFilter = await createRequestFilterWithRules([cspRule, cookieRule]);
    const cspResultDocument = requestFilter.findCspRules(url, url, adguard.RequestTypes.DOCUMENT);
    assert.equal(cspResultDocument.length, 1);
    assert.equal(cspResultDocument[0].getText(), cspRule);

    const cspResultSubDocument = requestFilter.findCspRules(url, url, adguard.RequestTypes.SUBDOCUMENT);
    assert.equal(cspResultSubDocument.length, 1);
    assert.equal(cspResultSubDocument[0].getText(), cspRule);

    const cookieResult = requestFilter.findCookieRules(url, url, adguard.RequestTypes.DOCUMENT);
    assert.equal(cookieResult.length, 1);
    assert.equal(cookieResult[0].getText(), cookieRule);
});

// https://github.com/AdguardTeam/AdguardBrowserExtension/issues/1586
QUnit.test('Request filter finds rules for domains with "." in the end', async (assert) => {
    const cssRuleText = 'www.benchmark.pl##body';
    let requestFilter = await createRequestFilterWithRules([cssRuleText]);

    // eslint-disable-next-line max-len
    const { css: [firstCss] } = requestFilter.getSelectorsForUrl('http://www.benchmark.pl./', CosmeticOption.CosmeticOptionAll);
    assert.ok(firstCss);
    assert.ok(firstCss.indexOf('body { display: none!important; }') > -1);

    const urlRuleText = '||cdn.benchmark.pl^$domain=benchmark.pl';
    requestFilter = await createRequestFilterWithRules([cssRuleText, urlRuleText]);

    const rule = requestFilter.findRuleForRequest(
        'http://cdn.benchmark.pl/assets/css/mainPage.min.css',
        'http://www.benchmark.pl./',
        adguard.RequestTypes.STYLESHEET
    );

    assert.equal(rule.getText(), urlRuleText);
});

// https://github.com/AdguardTeam/AdguardBrowserExtension/issues/1534
// eslint-disable-next-line max-len
QUnit.test('In case request has "DOCUMENT" type - $domain modifier will match as well request URL hostname', async (assert) => {
    const urlRuleText = '||check.com/url$domain=example.org|check.com';
    const requestFilter = await createRequestFilterWithRules([urlRuleText]);

    // Will match document url host
    let rule = requestFilter.findRuleForRequest(
        'http://check.com/url',
        'http://www.example.org/',
        adguard.RequestTypes.DOCUMENT
    );

    assert.equal(rule.getText(), urlRuleText);

    // request url doesn't match
    rule = requestFilter.findRuleForRequest(
        'http://another.org/url',
        'http://www.example.org/',
        adguard.RequestTypes.DOCUMENT
    );

    assert.notOk(rule);

    // Will match request url host
    rule = requestFilter.findRuleForRequest(
        'http://check.com/url',
        'http://test.com/',
        adguard.RequestTypes.DOCUMENT
    );

    assert.equal(rule.getText(), urlRuleText);

    // Will match request url host
    rule = requestFilter.findRuleForRequest(
        'http://check.com/url',
        'http://test.com/',
        adguard.RequestTypes.SUBDOCUMENT
    );

    assert.equal(rule.getText(), urlRuleText);

    // Request type DOCUMENT is required
    rule = requestFilter.findRuleForRequest(
        'http://check.com/url',
        'http://test.com/',
        adguard.RequestTypes.IMAGE
    );

    assert.notOk(rule);
});

// // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/1534
// eslint-disable-next-line max-len
QUnit.test('In case request has "DOCUMENT" type - $domain modifier will match as well request URL hostname', async (assert) => {
    const urlRuleText = '|http://$third-party,domain=example.org';
    const requestFilter = await createRequestFilterWithRules([urlRuleText]);

    // Will match document url host
    let rule = requestFilter.findRuleForRequest(
        'http://check.com/url',
        'http://www.example.org/',
        adguard.RequestTypes.DOCUMENT
    );

    assert.equal(rule.getText(), urlRuleText);

    // Will match request url host
    // rule = requestFilter.findRuleForRequest(
    //     'http://www.example.org/url',
    //     'http://test.com/',
    //     adguard.RequestTypes.DOCUMENT
    // );
    //
    // assert.equal(rule.getText(), urlRuleText);

    // Request type DOCUMENT is required
    rule = requestFilter.findRuleForRequest(
        'http://check.com/url',
        'http://test.com/',
        adguard.RequestTypes.SUBDOCUMENT
    );

    assert.notOk(rule);

    // Request type DOCUMENT is required
    rule = requestFilter.findRuleForRequest(
        'http://check.com/url',
        'http://test.com/',
        adguard.RequestTypes.IMAGE
    );

    assert.notOk(rule);
});

QUnit.test('Invalid scriptlets are not added to the scripts string', async (assert) => {
    const validScriptletRuleText = 'example.org#%#//scriptlet("adjust-setTimeout", "example", "400")';
    const invalidScriptletRuleText = 'example.org#%#//scriptlet("adjust-setTimeout-invalid", "example", "400")';

    const requestFilter = await createRequestFilterWithRules([validScriptletRuleText, invalidScriptletRuleText]);
    const scripts = requestFilter.getScriptsForUrl('https://example.org');

    assert.equal(scripts.length, 2);
    assert.ok(scripts[0].script, 'valid rule has script field');
    assert.notOk(scripts[1].script, 'invalid rule has no script field');
});
