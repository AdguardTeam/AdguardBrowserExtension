/* eslint-disable max-len */
/* global QUnit, adguard */

adguard.webRequestService = adguard.webRequestService || {
    isCollectingCosmeticRulesHits: () => false,
};

QUnit.test('General', (assert) => {
    const url = 'https://test.com/';
    const referrer = 'example.org';

    const rule = new adguard.rules.UrlFilterRule('||test.com^');

    const requestFilter = new adguard.RequestFilter();
    requestFilter.addRule(rule);

    const result = requestFilter.findRuleForRequest(url, referrer, adguard.RequestTypes.SUBDOCUMENT);
    assert.ok(result != null);
    assert.equal(result.ruleText, rule.ruleText);
});

QUnit.test('Whitelist rules selecting', (assert) => {
    const { RequestTypes } = adguard;

    const url = 'https://test.com/';
    const referrer = 'http://example.org';

    const rule = new adguard.rules.UrlFilterRule('||test.com^');
    const whitelist = new adguard.rules.UrlFilterRule('@@||test.com^');
    const documentRule = new adguard.rules.UrlFilterRule('@@||test.com^$document');
    const genericHideRule = new adguard.rules.UrlFilterRule('@@||test.com^$generichide');

    const requestFilter = new adguard.RequestFilter();
    requestFilter.addRule(rule);

    let result;
    result = requestFilter.findRuleForRequest(url, referrer, RequestTypes.SUBDOCUMENT);
    assert.ok(result != null);
    assert.equal(result.ruleText, rule.ruleText);

    requestFilter.addRule(whitelist);
    result = requestFilter.findRuleForRequest(url, referrer, RequestTypes.SUBDOCUMENT, whitelist);
    assert.ok(result != null);
    assert.equal(result.ruleText, whitelist.ruleText);

    result = requestFilter.findWhiteListRule(url, referrer, RequestTypes.SUBDOCUMENT);
    assert.ok(result != null);
    assert.equal(result.ruleText, whitelist.ruleText);

    requestFilter.addRule(documentRule);
    result = requestFilter.findRuleForRequest(url, referrer, RequestTypes.SUBDOCUMENT, whitelist);
    assert.ok(result != null);
    assert.equal(result.ruleText, whitelist.ruleText);

    result = requestFilter.findWhiteListRule(url, referrer, RequestTypes.DOCUMENT);
    assert.ok(result != null);
    assert.equal(result.ruleText, documentRule.ruleText);

    requestFilter.removeRule(documentRule);
    requestFilter.addRule(genericHideRule);
    result = requestFilter.findWhiteListRule(url, referrer, RequestTypes.DOCUMENT);
    assert.ok(result != null);
    assert.equal(result.ruleText, genericHideRule.ruleText);
});

QUnit.test('Important modifier rules', (assert) => {
    const { RequestTypes } = adguard;

    const url = 'https://test.com/';
    const referrer = 'http://example.org';

    const requestFilter = new adguard.RequestFilter();

    const rule = new adguard.rules.UrlFilterRule('||test.com^');
    const whitelist = new adguard.rules.UrlFilterRule('@@||test.com^');
    const important = new adguard.rules.UrlFilterRule('||test.com^$important');
    const documentRule = new adguard.rules.UrlFilterRule('@@||example.org^$document');

    assert.ok(rule.isFiltered(url, true, RequestTypes.IMAGE));
    assert.ok(whitelist.isFiltered(url, true, RequestTypes.IMAGE));
    assert.ok(important.isFiltered(url, true, RequestTypes.IMAGE));
    assert.ok(documentRule.isFiltered(referrer, true, RequestTypes.DOCUMENT));

    let result;

    requestFilter.addRule(rule);
    result = requestFilter.findRuleForRequest(url, referrer, RequestTypes.SUBDOCUMENT);
    assert.ok(result != null);
    assert.equal(result.ruleText, rule.ruleText);

    requestFilter.addRule(whitelist);
    result = requestFilter.findRuleForRequest(url, referrer, RequestTypes.SUBDOCUMENT, whitelist);
    assert.ok(result != null);
    assert.equal(result.ruleText, whitelist.ruleText);

    requestFilter.addRule(important);
    result = requestFilter.findRuleForRequest(url, referrer, RequestTypes.SUBDOCUMENT);
    assert.ok(result != null);
    assert.equal(result.ruleText, important.ruleText);

    requestFilter.addRule(documentRule);
    result = requestFilter.findRuleForRequest(url, referrer, RequestTypes.SUBDOCUMENT, documentRule);
    assert.ok(result != null);
    assert.equal(result.ruleText, documentRule.ruleText);
});

QUnit.test('CSP rules', (assert) => {
    let requestFilter = new adguard.RequestFilter();

    const cspRule = new adguard.rules.UrlFilterRule('||xpanama.net^$third-party,csp=connect-src \'none\',domain=~example.org|merriam-webster.com');
    requestFilter.addRule(cspRule);

    let rules = requestFilter.findCspRules('https://nop.xpanama.net/if.html?adflag=1&cb=kq4iOggNyP', 'https://www.merriam-webster.com/', adguard.RequestTypes.DOCUMENT);
    assert.ok(rules.length === 1);
    assert.equal(rules[0].ruleText, cspRule.ruleText);

    rules = requestFilter.findCspRules('https://xpanama.net', 'https://example.org', adguard.RequestTypes.DOCUMENT);
    assert.ok(!rules || rules.length === 0);

    // Add matching directive whitelist rule
    const directiveWhiteListRule = new adguard.rules.UrlFilterRule('@@||xpanama.net^$csp=connect-src \'none\'');
    requestFilter.addRule(directiveWhiteListRule);
    rules = requestFilter.findCspRules('https://xpanama.net', 'https://www.merriam-webster.com/', adguard.RequestTypes.DOCUMENT);
    // Specific whitelist rule should be returned
    assert.ok(rules.length === 1);
    assert.equal(rules[0].ruleText, directiveWhiteListRule.ruleText);

    // Add global whitelist rule
    const globalWhiteListRule = new adguard.rules.UrlFilterRule('@@||xpanama.net^$csp');
    requestFilter.addRule(globalWhiteListRule);
    rules = requestFilter.findCspRules('https://xpanama.net', 'https://www.merriam-webster.com/', adguard.RequestTypes.DOCUMENT);
    // Global whitelist rule should be returned
    assert.ok(rules.length === 1);
    assert.equal(rules[0].ruleText, globalWhiteListRule.ruleText);
    requestFilter.removeRule(directiveWhiteListRule);
    requestFilter.removeRule(globalWhiteListRule);

    // Add whitelist rule, but with not matched directive
    const directiveMissWhiteListRule = new adguard.rules.UrlFilterRule('@@||xpanama.net^$csp=frame-src \'none\'');
    requestFilter.addRule(directiveMissWhiteListRule);
    rules = requestFilter.findCspRules('https://xpanama.net', 'https://www.merriam-webster.com/', adguard.RequestTypes.DOCUMENT);
    assert.ok(rules.length === 1);
    assert.equal(rules[0].ruleText, cspRule.ruleText);

    // Add CSP rule with duplicated directive
    const duplicateCspRule = new adguard.rules.UrlFilterRule('||xpanama.net^$third-party,csp=connect-src \'none\'');
    requestFilter.addRule(duplicateCspRule);
    rules = requestFilter.findCspRules('https://xpanama.net', 'https://www.merriam-webster.com/', adguard.RequestTypes.DOCUMENT);
    assert.ok(rules.length === 1);
    assert.ok(rules[0].ruleText === cspRule.ruleText || rules[0].ruleText === duplicateCspRule.ruleText);

    // Test request type matching
    requestFilter = new adguard.RequestFilter();

    const cspRuleSubDocument = new adguard.rules.UrlFilterRule('||xpanama.net^$csp=connect-src http:,domain=merriam-webster.com,subdocument');
    const cspRuleNotSubDocument = new adguard.rules.UrlFilterRule('||xpanama.net^$csp=connect-src \'none\',domain=merriam-webster.com,~subdocument');
    const cspRuleAny = new adguard.rules.UrlFilterRule('||xpanama.net^$csp=frame-src \'none\',domain=merriam-webster.com');
    requestFilter.addRule(cspRuleSubDocument);
    requestFilter.addRule(cspRuleAny);
    requestFilter.addRule(cspRuleNotSubDocument);

    rules = requestFilter.findCspRules('https://nop.xpanama.net/if.html?adflag=1&cb=kq4iOggNyP', 'https://www.merriam-webster.com/', adguard.RequestTypes.DOCUMENT) || [];
    assert.ok(rules.length === 2);
    assert.ok(rules[0].ruleText === cspRuleAny.ruleText || rules[0].ruleText === cspRuleNotSubDocument.ruleText);
    assert.ok(rules[1].ruleText === cspRuleAny.ruleText || rules[1].ruleText === cspRuleNotSubDocument.ruleText);

    rules = requestFilter.findCspRules('https://nop.xpanama.net/if.html?adflag=1&cb=kq4iOggNyP', 'https://www.merriam-webster.com/', adguard.RequestTypes.SUBDOCUMENT) || [];
    assert.ok(rules.length === 2);
    assert.ok(rules[0].ruleText === cspRuleAny.ruleText || rules[0].ruleText === cspRuleSubDocument.ruleText);
    assert.ok(rules[1].ruleText === cspRuleAny.ruleText || rules[1].ruleText === cspRuleSubDocument.ruleText);
});

QUnit.test('Test CSP invalid rules', (assert) => {
    // Invalid csp rules
    let invalidRule = adguard.rules.builder.createRule('||$csp=report-uri /csp-violation-report-endpoint/', 1);
    assert.ok(!invalidRule);

    invalidRule = adguard.rules.builder.createRule('||$csp=report-to /csp-violation-report-endpoint/', 1);
    assert.ok(!invalidRule);

    let correctRule = adguard.rules.builder.createRule('||$csp=frame-src \'none\',subdocument', 1);
    assert.ok(correctRule);

    correctRule = adguard.rules.builder.createRule('||$csp=frame-src \'none\',~subdocument', 1);
    assert.ok(correctRule);

    correctRule = adguard.rules.builder.createRule('||$csp=frame-src \'none\'', 1);
    assert.ok(correctRule);
});

QUnit.test('Test CSP important rules', (assert) => {
    // Test important rules
    const requestFilter = new adguard.RequestFilter();

    const globalWhiteListRule = new adguard.rules.UrlFilterRule('@@||xpanama.net^$csp,domain=merriam-webster.com');
    const directiveWhiteListRule = new adguard.rules.UrlFilterRule('@@||xpanama.net^$csp=frame-src \'none\',domain=merriam-webster.com');
    const importantDirectiveWhiteListRule = new adguard.rules.UrlFilterRule('@@||xpanama.net^$csp=frame-src \'none\',domain=merriam-webster.com,important');
    const defaultCspRule = new adguard.rules.UrlFilterRule('||xpanama.net^$csp=frame-src \'none\',domain=merriam-webster.com');
    const importantCspRule = new adguard.rules.UrlFilterRule('||xpanama.net^$csp=frame-src \'none\',domain=merriam-webster.com,important');
    requestFilter.addRule(importantDirectiveWhiteListRule);
    requestFilter.addRule(importantCspRule);
    requestFilter.addRule(defaultCspRule);
    requestFilter.addRule(globalWhiteListRule);
    requestFilter.addRule(directiveWhiteListRule);

    let rules = requestFilter.findCspRules('https://nop.xpanama.net/if.html?adflag=1&cb=kq4iOggNyP', 'https://www.merriam-webster.com/', adguard.RequestTypes.DOCUMENT) || [];
    assert.ok(rules.length === 1);
    assert.equal(rules[0].ruleText, globalWhiteListRule.ruleText);

    requestFilter.removeRule(globalWhiteListRule);
    rules = requestFilter.findCspRules('https://nop.xpanama.net/if.html?adflag=1&cb=kq4iOggNyP', 'https://www.merriam-webster.com/', adguard.RequestTypes.DOCUMENT) || [];
    assert.ok(rules.length === 1);
    assert.equal(rules[0].ruleText, importantDirectiveWhiteListRule.ruleText);

    requestFilter.removeRule(importantDirectiveWhiteListRule);
    rules = requestFilter.findCspRules('https://nop.xpanama.net/if.html?adflag=1&cb=kq4iOggNyP', 'https://www.merriam-webster.com/', adguard.RequestTypes.DOCUMENT) || [];
    assert.ok(rules.length === 1);
    assert.equal(rules[0].ruleText, importantCspRule.ruleText);

    requestFilter.removeRule(importantCspRule);
    rules = requestFilter.findCspRules('https://nop.xpanama.net/if.html?adflag=1&cb=kq4iOggNyP', 'https://www.merriam-webster.com/', adguard.RequestTypes.DOCUMENT) || [];
    assert.ok(rules.length === 1);
    assert.equal(rules[0].ruleText, directiveWhiteListRule.ruleText);

    requestFilter.removeRule(directiveWhiteListRule);
    rules = requestFilter.findCspRules('https://nop.xpanama.net/if.html?adflag=1&cb=kq4iOggNyP', 'https://www.merriam-webster.com/', adguard.RequestTypes.DOCUMENT) || [];
    assert.ok(rules.length === 1);
    assert.equal(rules[0].ruleText, defaultCspRule.ruleText);
});

QUnit.test('Cookie rules', (assert) => {
    const requestFilter = new adguard.RequestFilter();

    const cookieRule = new adguard.rules.UrlFilterRule('||xpanama.net^$third-party,cookie=c_user,domain=~example.org|merriam-webster.com');
    requestFilter.addRule(cookieRule);

    const rules = requestFilter.findCookieRules('https://nop.xpanama.net/if.html?adflag=1&cb=kq4iOggNyP', 'https://www.merriam-webster.com/', adguard.RequestTypes.DOCUMENT);
    assert.ok(rules.length === 1);
    assert.equal(rules[0].ruleText, cookieRule.ruleText);

    // TODO: Add cases and other tests
});

QUnit.test('Redirect rules', (assert) => {
    const invalidTitle = 'space';
    const validTitle = 'noopjs';
    const noopJsContent = '(function() {})()';
    const jsContentType = 'application/javascript';

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
          contentType: ${jsContentType}
          content: ${noopJsContent}`;

    adguard.rules.RedirectFilterService.setRedirectSources(rawYaml);
    const requestFilter = new adguard.RequestFilter();

    // Test rules creation
    let redirectRule = new adguard.rules.UrlFilterRule('example.org/ads.js$script,redirect=noopjs', 0);
    const blockRedirectRule = new adguard.rules.UrlFilterRule('||example.org/*.png$image,redirect=1x1-transparent.gif', 0);
    requestFilter.addRules([redirectRule, blockRedirectRule]);
    const rule = requestFilter.findRuleForRequest('http://example.org/ads.js', 'http://example.org/', adguard.RequestTypes.SCRIPT);
    assert.equal(rule.getRedirect().redirectTitle, 'noopjs');
    const imgRule = requestFilter.findRuleForRequest('http://example.org/ad.png', 'http://example.org/', adguard.RequestTypes.IMAGE);
    assert.equal(imgRule.getRedirect().redirectTitle, '1x1-transparent.gif');

    // Test that rule correct url has been build
    const validRule = new adguard.rules.UrlFilterRule(`example.org/ads.js$script,redirect=${validTitle}`, 0);
    const redirectOption = validRule.getRedirect();
    const url = redirectOption.getRedirectUrl();
    const [rawContentType, base64str] = url.split(',');
    assert.equal(atob(base64str), noopJsContent, 'decoded string should be equal with source');
    const [contentType] = rawContentType.split(';');
    assert.equal(contentType, `data:${jsContentType}`);

    // Test that rules with invalid redirect option throw error
    assert.throws(() => {
        const invalidRule = new adguard.rules.UrlFilterRule(`example.org/ads.js$script,redirect=${invalidTitle}`, 0);
        requestFilter.addRule(invalidRule);
    }, new Error(`Unknown redirect source title: ${invalidTitle}`), 'invalid redirect rules should throw error');

    // Test that redirect rules has higher priority than basic rules
    redirectRule = new adguard.rules.UrlFilterRule('||8s8.eu^*fa.js$script,redirect=noopjs');
    const basicRule = new adguard.rules.UrlFilterRule('||8s8.eu^*fa.js$script');

    assert.ok(redirectRule.isFiltered('http://8s8.eu/bla-fa.js', true, adguard.RequestTypes.SCRIPT));
    // assert.ok(redirectRule.isPermitted('test.com'));
    assert.ok(basicRule.isFiltered('http://8s8.eu/bla-fa.js', true, adguard.RequestTypes.SCRIPT));
    // assert.ok(basicRule.isPermitted('http://example.com'));

    const urlFilter = new adguard.rules.UrlFilter();
    urlFilter.addRule(basicRule);
    urlFilter.addRule(redirectRule);

    const result = urlFilter.isFiltered('http://8s8.eu/bla-fa.js', 'test.com', adguard.RequestTypes.SCRIPT, true);
    assert.ok(result !== null);
    assert.equal(result.ruleText, redirectRule.ruleText);
});

// https://github.com/AdguardTeam/AdguardBrowserExtension/issues/1453
QUnit.test('$object subrequest modifier should be unknown', (assert) => {
    assert.throws(() => {
        // eslint-disable-next-line no-unused-vars
        const rule = new adguard.rules.UrlFilterRule('example.org/blockrequest$object-subrequest');
    }, 'Unknown option: OBJECT-SUBREQUEST');
});

QUnit.test('BadFilter option', (assert) => {
    const rule = new adguard.rules.UrlFilterRule('https:*_ad_');
    const ruleTwo = new adguard.rules.UrlFilterRule('https:*_da_');
    const ruleThree = new adguard.rules.UrlFilterRule('https:*_ad_$match-case');
    const badFilterRule = new adguard.rules.UrlFilterRule('https:*_ad_$badfilter');

    const requestFilter = new adguard.RequestFilter();

    requestFilter.addRule(rule);
    requestFilter.addRule(ruleTwo);

    assert.ok(requestFilter.findRuleForRequest('https://google.com/_ad_agency', '', adguard.RequestTypes.SUBDOCUMENT));
    assert.ok(requestFilter.findRuleForRequest('https://google.com/_da_agency', '', adguard.RequestTypes.SUBDOCUMENT));

    requestFilter.addRule(badFilterRule);
    assert.ok(requestFilter.getRules().indexOf(badFilterRule) >= 0);

    assert.notOk(requestFilter.findRuleForRequest('https://google.com/_ad_agency', '', adguard.RequestTypes.SUBDOCUMENT));
    assert.ok(requestFilter.findRuleForRequest('https://google.com/_da_agency', '', adguard.RequestTypes.SUBDOCUMENT));

    requestFilter.removeRule(rule);
    requestFilter.addRule(ruleThree);

    assert.ok(requestFilter.findRuleForRequest('https://google.com/_ad_agency', '', adguard.RequestTypes.SUBDOCUMENT));
    assert.ok(requestFilter.findRuleForRequest('https://google.com/_da_agency', '', adguard.RequestTypes.SUBDOCUMENT));

    requestFilter.removeRule(badFilterRule);
    assert.notOk(requestFilter.getRules().indexOf(badFilterRule) >= 0);

    assert.ok(requestFilter.findRuleForRequest('https://google.com/_ad_agency', '', adguard.RequestTypes.SUBDOCUMENT));
    assert.ok(requestFilter.findRuleForRequest('https://google.com/_da_agency', '', adguard.RequestTypes.SUBDOCUMENT));

    requestFilter.removeRule(ruleThree);

    assert.notOk(requestFilter.findRuleForRequest('https://google.com/_ad_agency', '', adguard.RequestTypes.SUBDOCUMENT));
    assert.ok(requestFilter.findRuleForRequest('https://google.com/_da_agency', '', adguard.RequestTypes.SUBDOCUMENT));
});

QUnit.test('BadFilter option whitelist', (assert) => {
    const url = 'https://test.com/';
    const referrer = 'http://example.org';

    const rule = new adguard.rules.UrlFilterRule('||test.com^');
    const whitelist = new adguard.rules.UrlFilterRule('@@||test.com^');
    const badFilterRule = new adguard.rules.UrlFilterRule('@@||test.com^$badfilter');

    const requestFilter = new adguard.RequestFilter();

    requestFilter.addRule(rule);

    let result = requestFilter.findRuleForRequest(url, referrer, adguard.RequestTypes.SUBDOCUMENT);
    assert.ok(result);
    assert.equal(result.ruleText, rule.ruleText);

    requestFilter.addRule(whitelist);

    result = requestFilter.findWhiteListRule(url, referrer, adguard.RequestTypes.SUBDOCUMENT);
    assert.ok(result);
    assert.equal(result.ruleText, whitelist.ruleText);

    result = requestFilter.findRuleForRequest(url, referrer, adguard.RequestTypes.SUBDOCUMENT);
    assert.ok(result);
    assert.equal(result.ruleText, whitelist.ruleText);

    requestFilter.addRule(badFilterRule);

    result = requestFilter.findWhiteListRule(url, referrer, adguard.RequestTypes.SUBDOCUMENT);
    assert.notOk(result);

    result = requestFilter.findRuleForRequest(url, referrer, adguard.RequestTypes.SUBDOCUMENT);
    assert.ok(result);
    assert.equal(result.ruleText, rule.ruleText);
});

QUnit.test('BadFilter multi-options', (assert) => {
    const rule = new adguard.rules.UrlFilterRule('||example.org^$object');
    const ruleTwo = new adguard.rules.UrlFilterRule('||example.org^');
    let badFilterRule = new adguard.rules.UrlFilterRule('||example.org^$badfilter,object');

    const requestFilter = new adguard.RequestFilter();

    requestFilter.addRule(rule);
    requestFilter.addRule(ruleTwo);

    assert.ok(requestFilter.findRuleForRequest('https://example.org', '', adguard.RequestTypes.OBJECT));
    assert.ok(requestFilter.findRuleForRequest('https://example.org', '', adguard.RequestTypes.SUBDOCUMENT));


    requestFilter.addRule(badFilterRule);
    assert.ok(requestFilter.findRuleForRequest('https://example.org', '', adguard.RequestTypes.OBJECT));
    assert.ok(requestFilter.findRuleForRequest('https://example.org', '', adguard.RequestTypes.SUBDOCUMENT));
    assert.strictEqual(ruleTwo, requestFilter.findRuleForRequest('https://example.org', '', adguard.RequestTypes.OBJECT));
    assert.strictEqual(ruleTwo, requestFilter.findRuleForRequest('https://example.org', '', adguard.RequestTypes.SUBDOCUMENT));

    requestFilter.removeRule(badFilterRule);

    assert.ok(requestFilter.findRuleForRequest('https://example.org', '', adguard.RequestTypes.OBJECT));
    assert.ok(requestFilter.findRuleForRequest('https://example.org', '', adguard.RequestTypes.SUBDOCUMENT));


    badFilterRule = new adguard.rules.UrlFilterRule('||example.org^$object,badfilter');

    requestFilter.addRule(badFilterRule);

    assert.ok(requestFilter.findRuleForRequest('https://example.org', '', adguard.RequestTypes.OBJECT));
    assert.ok(requestFilter.findRuleForRequest('https://example.org', '', adguard.RequestTypes.SUBDOCUMENT));
    assert.strictEqual(ruleTwo, requestFilter.findRuleForRequest('https://example.org', '', adguard.RequestTypes.OBJECT));
    assert.strictEqual(ruleTwo, requestFilter.findRuleForRequest('https://example.org', '', adguard.RequestTypes.SUBDOCUMENT));

    requestFilter.removeRule(badFilterRule);

    assert.ok(requestFilter.findRuleForRequest('https://example.org', '', adguard.RequestTypes.OBJECT));
    assert.ok(requestFilter.findRuleForRequest('https://example.org', '', adguard.RequestTypes.SUBDOCUMENT));
});

QUnit.test('BadFilter doesn stop looking for other rules', (assert) => {
    const rule = new adguard.rules.UrlFilterRule('||example.org^$third-party');
    const ruleTwo = new adguard.rules.UrlFilterRule('||example.org^$xmlhttprequest');
    let badFilterRule = new adguard.rules.UrlFilterRule('||example.org^$third-party,badfilter');

    const requestFilter = new adguard.RequestFilter();

    requestFilter.addRule(rule);
    requestFilter.addRule(ruleTwo);
    assert.ok(requestFilter.findRuleForRequest('https://example.org', 'https://third-party.com', adguard.RequestTypes.DOCUMENT));
    assert.ok(requestFilter.findRuleForRequest('https://example.org', '', adguard.RequestTypes.XMLHTTPREQUEST));


    requestFilter.addRule(badFilterRule);

    assert.notOk(requestFilter.findRuleForRequest('https://example.org', 'https://third-party.com', adguard.RequestTypes.DOCUMENT));
    assert.ok(requestFilter.findRuleForRequest('https://example.org', '', adguard.RequestTypes.XMLHTTPREQUEST));

    requestFilter.removeRule(badFilterRule);

    assert.ok(requestFilter.findRuleForRequest('https://example.org', 'https://third-party.com', adguard.RequestTypes.DOCUMENT));
    assert.ok(requestFilter.findRuleForRequest('https://example.org', '', adguard.RequestTypes.XMLHTTPREQUEST));

    badFilterRule = new adguard.rules.UrlFilterRule('||example.org^$xmlhttprequest,badfilter');

    requestFilter.addRule(badFilterRule);

    assert.ok(requestFilter.findRuleForRequest('https://example.org', 'https://third-party.com', adguard.RequestTypes.DOCUMENT));
    assert.notOk(requestFilter.findRuleForRequest('https://example.org', '', adguard.RequestTypes.XMLHTTPREQUEST));

    requestFilter.removeRule(badFilterRule);

    assert.ok(requestFilter.findRuleForRequest('https://example.org', 'https://third-party.com', adguard.RequestTypes.DOCUMENT));
    assert.ok(requestFilter.findRuleForRequest('https://example.org', '', adguard.RequestTypes.XMLHTTPREQUEST));
});

QUnit.test('Replace filters', (assert) => {
    const rules = [
        '||example.org^$replace=/test/test1/g',
        '||example.org^$replace=/test1/test2/g',
    ];

    const requestFilter = new adguard.RequestFilter();

    adguard.prefs.features.responseContentFilteringSupported = true;

    const urlFilterRules = rules.map(rule => new adguard.rules.UrlFilterRule(rule));

    requestFilter.addRules(urlFilterRules);

    const replaceRules = requestFilter.findReplaceRules('https://example.org', '', adguard.RequestTypes.DOCUMENT);

    assert.ok(replaceRules);
    assert.equal(replaceRules.length, rules.length);
});

QUnit.test('whitelisted replace filter with same option is omitted', (assert) => {
    const expectedRule = '||example.org^$replace=/test/test1/g';

    const rules = [
        expectedRule,
        '||example.org^$replace=/test1/test2/g',
        '@@||example.org^$replace=/test1/test2/g',
    ];

    const requestFilter = new adguard.RequestFilter();

    adguard.prefs.features.responseContentFilteringSupported = true;

    const urlFilterRules = rules.map(rule => new adguard.rules.UrlFilterRule(rule));

    requestFilter.addRules(urlFilterRules);

    const replaceRules = requestFilter.findReplaceRules('https://example.org', '', adguard.RequestTypes.DOCUMENT);

    assert.ok(replaceRules);
    assert.equal(replaceRules.length, 2);
});

QUnit.test('whitelist rules with $stealth modifier', (assert) => {
    const stealthRule = new adguard.rules.UrlFilterRule('@@||example.org^$stealth');

    const requestFilter = new adguard.RequestFilter();
    requestFilter.addRule(stealthRule);

    const result = requestFilter.findStealthWhiteListRule('https://example.org/test.js', 'https://example.org', adguard.RequestTypes.SCRIPT);

    assert.ok(result);
    assert.ok(result.whiteListRule);
    assert.equal(result.textRule, stealthRule.textRule);

    const thirdPartResult = requestFilter.findStealthWhiteListRule('https://other-example.org/test.js', 'https://example.org', adguard.RequestTypes.SCRIPT);

    assert.ok(thirdPartResult);
    assert.ok(thirdPartResult.whiteListRule);
    assert.equal(thirdPartResult.textRule, stealthRule.textRule);
});

QUnit.test('whitelist rules with $stealth and $script modifier', (assert) => {
    const stealthRule = new adguard.rules.UrlFilterRule('@@||example.org^$script,stealth');

    const requestFilter = new adguard.RequestFilter();
    requestFilter.addRule(stealthRule);

    const notScriptRuleResult = requestFilter.findStealthWhiteListRule('https://example.org/test.jpg', 'https://example.org', adguard.RequestTypes.DOCUMENT);

    const scriptRuleResult = requestFilter.findStealthWhiteListRule('https://example.org/test.js', 'https://example.org', adguard.RequestTypes.SCRIPT);

    assert.notOk(notScriptRuleResult);
    assert.ok(scriptRuleResult);
    assert.ok(scriptRuleResult.whiteListRule);
    assert.equal(scriptRuleResult.textRule, stealthRule.textRule);
});

QUnit.test('whitelist rules with $stealth and $domain modifiers', (assert) => {
    const stealthRule = new adguard.rules.UrlFilterRule('@@||hdslb.com^$domain=bilibili.com,stealth');

    const requestFilter = new adguard.RequestFilter();
    requestFilter.addRule(stealthRule);

    const thirdPartyRule = requestFilter.findStealthWhiteListRule('https://hdslb.com/test.js', 'https://bilibili.com', adguard.RequestTypes.SCRIPT);

    const ruleForDifferentDomain = requestFilter.findStealthWhiteListRule('https://mail.com/test.js', 'https://bilibili.com', adguard.RequestTypes.SCRIPT);

    assert.ok(thirdPartyRule);
    assert.ok(thirdPartyRule.whiteListRule);
    assert.notOk(ruleForDifferentDomain);
    assert.equal(thirdPartyRule.textRule, stealthRule.textRule);
});

QUnit.test('whitelist rules with $stealth and $third-party modifier', (assert) => {
    const stealthRule = new adguard.rules.UrlFilterRule('@@||example.org^$stealth,third-party');

    const requestFilter = new adguard.RequestFilter();
    requestFilter.addRule(stealthRule);

    const result = requestFilter.findStealthWhiteListRule('https://example.org/test', 'https://example.org', adguard.RequestTypes.SCRIPT);

    const thirdPartyResult = requestFilter.findStealthWhiteListRule('https://third-party.org/test', 'https://example.org', adguard.RequestTypes.SCRIPT);

    assert.notOk(result);
    assert.ok(thirdPartyResult);
    assert.ok(thirdPartyResult.whiteListRule);
    assert.equal(thirdPartyResult.textRule, thirdPartyResult.textRule);
});

QUnit.test('replace filter with empty $replace modifier should remove all other replace rules', (assert) => {
    const rules = [
        '||example.org^$replace=/test/test1/g',
        '||example.org^$replace=/test1/test2/g',
        '@@||example.org^$replace',
    ];

    const requestFilter = new adguard.RequestFilter();

    adguard.prefs.features.responseContentFilteringSupported = true;

    const urlFilterRules = rules.map(rule => new adguard.rules.UrlFilterRule(rule));

    requestFilter.addRules(urlFilterRules);

    const replaceRules = requestFilter.findReplaceRules('https://example.org', '', adguard.RequestTypes.DOCUMENT);

    assert.ok(replaceRules);
    assert.ok(replaceRules[0].whiteListRule);
    assert.equal(rules.length, 3);
    assert.equal(replaceRules.length, 1);
});

QUnit.test('replace rules with $badfilter modifier', (assert) => {
    const rules = [
        '||example.org^$replace=/test/test1/g',
        '||example.org^$replace=/test1/test2/g',
        '||example.org^$replace=/test/test1/g,badfilter',
    ];

    const requestFilter = new adguard.RequestFilter();

    adguard.prefs.features.responseContentFilteringSupported = true;

    const urlFilterRules = rules.map(rule => new adguard.rules.UrlFilterRule(rule));

    requestFilter.addRules(urlFilterRules);

    const replaceRules = requestFilter.findReplaceRules('https://example.org', '', adguard.RequestTypes.DOCUMENT);

    assert.ok(replaceRules);
    assert.equal(replaceRules[0].ruleText, rules[1]);
    assert.equal(rules.length, 3);
    assert.equal(replaceRules.length, 1);
});

QUnit.test('stealth rules with $badfilter modifier', (assert) => {
    const whiteListRule = new adguard.rules.UrlFilterRule('@@||example.org^$stealth');

    const requestFilter = new adguard.RequestFilter();

    requestFilter.addRule(whiteListRule);

    let result = requestFilter.findStealthWhiteListRule('https://example.org', 'https://example.org', adguard.RequestTypes.DOCUMENT);

    assert.ok(result);
    assert.equal(result.ruleText, whiteListRule.ruleText);
    assert.ok(result.whiteListRule);

    const badFilterRule = new adguard.rules.UrlFilterRule('@@||example.org^$stealth,badfilter');
    requestFilter.addRule(badFilterRule);
    result = requestFilter.findStealthWhiteListRule('https://example.org', 'https://example.org', adguard.RequestTypes.DOCUMENT);

    assert.notOk(result);
});

// https://github.com/AdguardTeam/AdguardBrowserExtension/issues/1573
QUnit.test('$csp rules created with $all modifier should be unblocked with $badfilter modifier', (assert) => {
    const requestFilter = new adguard.RequestFilter();
    const blockingCompositeRule = adguard.rules.builder.createRule('||example.org^$all', 0);

    requestFilter.addRule(blockingCompositeRule);

    let result = requestFilter.findCspRules('https://example.org', 'https://example.org', adguard.RequestTypes.DOCUMENT);
    assert.equal(result.length, 2);

    const whitelistCompositeRule = adguard.rules.builder.createRule('||example.org^$all,badfilter');
    requestFilter.addRule(whitelistCompositeRule);
    result = requestFilter.findCspRules('https://example.org', 'https://example.org', adguard.RequestTypes.DOCUMENT);
    assert.equal(result.length, 0);
});

// https://github.com/AdguardTeam/AdguardBrowserExtension/issues/1122
QUnit.test('Rule with extension modifier should be omitted in request filter', (assert) => {
    const rules = [
        '@@||example.org^$extension',
        '||example.org/favicon.ico',
        '||example.org/badcode.js',
    ];

    const requestFilter = new adguard.RequestFilter();

    const urlFilterRules = rules.map(rule => new adguard.rules.UrlFilterRule(rule));

    requestFilter.addRules(urlFilterRules);

    const requesRulesLength = requestFilter.getRules().length;

    assert.equal(requesRulesLength, rules.length - 1);
});

QUnit.test('requestFilter.findRuleForRequest performance', (assert) => {
    // eslint-disable-next-line no-undef
    const rules = filtersFromTxt; // variable filtersFromTxt is from 'test_filter.js'
    const requestFilter = new adguard.RequestFilter();
    for (let i = 0; i < rules.length; i += 1) {
        const rule = adguard.rules.builder.createRule(rules[i], adguard.utils.filters.USER_FILTER_ID);
        if (rule) {
            requestFilter.addRule(rule);
        }
    }

    const url = 'https://www.youtube.com/gaming';
    const referrer = 'http://example.org';

    const count = 50000;
    const startTime = new Date().getTime();
    for (let k = 0; k < count; k++) {
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
});

QUnit.test('$document modifier', (assert) => {
    const rule = new adguard.rules.UrlFilterRule('||example.org^$document');

    const requestFilter = new adguard.RequestFilter();

    requestFilter.addRule(rule);

    assert.ok(requestFilter.findRuleForRequest(
        'https://example.org',
        'https://example.org',
        adguard.RequestTypes.DOCUMENT
    ));
});

QUnit.test('redirect rules are removed with $badfilter modifier', (assert) => {
    const ruleText = '||example.org/favicon.ico$domain=example.org,empty,important';
    const badfilterRuleText = '||example.org/favicon.ico$domain=example.org,empty,important,badfilter';
    const rawYaml = `
    - title: nooptext
      aliases:
        - blank-text
      contentType: text/plain
      content: ''`;
    adguard.rules.RedirectFilterService.setRedirectSources(rawYaml);
    const requestFilter = new adguard.RequestFilter();
    const rule = adguard.rules.builder.createRule(ruleText, 1);
    requestFilter.addRule(rule);
    let result = requestFilter.findRuleForRequest(
        'https://example.org/favicon.ico',
        'https://example.org',
        adguard.RequestTypes.IMAGE
    );
    assert.ok(result, 'rule should be found');
    const badfilterRule = adguard.rules.builder.createRule(badfilterRuleText, 1);
    requestFilter.addRule(badfilterRule);
    result = requestFilter.findRuleForRequest(
        'https://example.org/favicon.ico',
        'https://example.org',
        adguard.RequestTypes.IMAGE
    );
    assert.notOk(result, 'rule should be blocked by badfilter rule');
});

QUnit.test('domain restriction semantic', (assert) => {
    const url = 'https://example.org/';
    const referrer = null;

    const cspRule = new adguard.rules.UrlFilterRule('$domain=example.org,csp=script-src \'none\'');
    const cookieRule = new adguard.rules.UrlFilterRule('$cookie=test,domain=example.org');

    const requestFilter = new adguard.RequestFilter();
    requestFilter.addRules([cspRule, cookieRule]);

    const cspResultDocument = requestFilter.findCspRules(url, referrer, adguard.RequestTypes.DOCUMENT);
    assert.equal(cspResultDocument.length, 1);
    assert.equal(cspResultDocument[0].ruleText, cspRule.ruleText);

    const cspResultSubDocument = requestFilter.findCspRules(url, referrer, adguard.RequestTypes.SUBDOCUMENT);
    assert.equal(cspResultSubDocument.length, 1);
    assert.equal(cspResultSubDocument[0].ruleText, cspRule.ruleText);

    const cookieResult = requestFilter.findCookieRules(url, referrer, adguard.RequestTypes.DOCUMENT);
    assert.equal(cookieResult.length, 1);
    assert.equal(cookieResult[0].ruleText, cookieRule.ruleText);
});

QUnit.test('CSP rules are found correctly', (assert) => {
    /**
     * For example:
     * rule1 = '||$csp'
     * rule2 = '||$csp,subdocument'
     * rule3 = '||$csp,~subdocument'
     * findCspRules(adguard.RequestTypes.SUBDOCUMENT) = [rule1, rule2];
     * findCspRules(adguard.RequestTypes.DOCUMENT) = [rule1, rule3];
     */
    const ruleText1 = '||example.org^$csp=default-src \'none\'';
    const ruleText2 = '||example.org^$csp=script-src \'none\',subdocument';
    const ruleText3 = '||example.org^$csp=connect-src \'none\',~subdocument';
    const url = 'https://example.org/blabla';
    const rule1 = new adguard.rules.UrlFilterRule(ruleText1);
    const rule2 = new adguard.rules.UrlFilterRule(ruleText2);
    const rule3 = new adguard.rules.UrlFilterRule(ruleText3);
    const requestFilter = new adguard.RequestFilter();
    requestFilter.addRules([rule1, rule2, rule3]);
    const search1 = requestFilter.findCspRules(url, null, adguard.RequestTypes.SUBDOCUMENT);
    assert.ok(search1.includes(rule1));
    assert.ok(search1.includes(rule2));
    assert.notOk(search1.includes(rule3));
    const search2 = requestFilter.findCspRules(url, null, adguard.RequestTypes.DOCUMENT);
    assert.ok(search2.includes(rule1));
    assert.notOk(search2.includes(rule2));
    assert.ok(search2.includes(rule3));
});

// https://github.com/AdguardTeam/AdguardBrowserExtension/issues/1586
QUnit.test('Request filter finds rules for domains with "." in the end', (assert) => {
    const selector = 'body';
    const cssRule = new adguard.rules.CssFilterRule(`benchmark.pl##${selector}`);

    const requestFilter = new adguard.RequestFilter();
    requestFilter.addRules([cssRule]);
    const { css: [firstCss] } = requestFilter.getSelectorsForUrl('http://www.benchmark.pl./', 1);
    assert.ok(firstCss.indexOf(`${selector} { display: none!important; }`) > -1);

    const urlRuleText = '||cdn.benchmark.pl^$domain=benchmark.pl';
    const urlRule = new adguard.rules.UrlFilterRule(urlRuleText);
    requestFilter.addRules([urlRule]);

    const rule = requestFilter.findRuleForRequest(
        'http://cdn.benchmark.pl/assets/css/mainPage.min.css',
        'http://www.benchmark.pl./',
        adguard.RequestTypes.STYLESHEET
    );
    assert.equal(rule.ruleText, urlRuleText);
});

// https://github.com/AdguardTeam/AdguardBrowserExtension/issues/1534
QUnit.test('In case request has "DOCUMENT" type - $domain modifier will match as well request URL hostname', (assert) => {
    const urlRuleText = '|http://$third-party,domain=example.org';
    const urlRule = new adguard.rules.UrlFilterRule(urlRuleText);

    const requestFilter = new adguard.RequestFilter();
    requestFilter.addRules([urlRule]);

    // Will match document url host
    let rule = requestFilter.findRuleForRequest(
        'http://check.com/url',
        'http://www.example.org/',
        adguard.RequestTypes.DOCUMENT
    );

    assert.equal(rule.ruleText, urlRuleText);

    // Will match request url host
    rule = requestFilter.findRuleForRequest(
        'http://www.example.org/url',
        'http://test.com/',
        adguard.RequestTypes.DOCUMENT
    );

    assert.equal(rule.ruleText, urlRuleText);

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

QUnit.test('Invalid scriptlets are not added to the scripts string', (assert) => {
    const validScriptletRuleText = 'example.org#%#//scriptlet("adjust-setTimeout", "example", "400")';
    const validScriptletRule = new adguard.rules.ScriptletRule(validScriptletRuleText);

    const invalidScriptletRuleText = 'example.org#%#//scriptlet("adjust-setTimeout-invalid", "example", "400")';
    const invalidScriptletRule = new adguard.rules.ScriptletRule(invalidScriptletRuleText);

    const requestFilter = new adguard.RequestFilter();
    requestFilter.addRules([validScriptletRule, invalidScriptletRule]);

    const scripts = requestFilter.getScriptsForUrl('https://example.org', true);

    assert.equal(scripts.length, 1, 'length of results should be one');
    assert.equal(scripts[0].rule.ruleText, validScriptletRuleText, 'valid rule should be in results');
});
