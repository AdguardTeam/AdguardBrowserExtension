/* global QUnit, adguard */

QUnit.test('General', function (assert) {
    var url = 'https://test.com/';
    var referrer = 'example.org';

    var rule = new adguard.rules.UrlFilterRule('||test.com^');

    var requestFilter = new adguard.RequestFilter();
    requestFilter.addRule(rule);

    var result = requestFilter.findRuleForRequest(url, referrer, adguard.RequestTypes.SUBDOCUMENT);
    assert.ok(result != null);
    assert.equal(result.ruleText, rule.ruleText);
});

QUnit.test('Whitelist rules selecting', function (assert) {
    var RequestTypes = adguard.RequestTypes;

    var url = 'https://test.com/';
    var referrer = 'http://example.org';

    var rule = new adguard.rules.UrlFilterRule('||test.com^');
    var whitelist = new adguard.rules.UrlFilterRule('@@||test.com^');
    var documentRule = new adguard.rules.UrlFilterRule('@@||test.com^$document');
    var genericHideRule = new adguard.rules.UrlFilterRule('@@||test.com^$generichide');

    var requestFilter = new adguard.RequestFilter();
    requestFilter.addRule(rule);

    var result;
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

QUnit.test('Important modifier rules', function (assert) {
    var RequestTypes = adguard.RequestTypes;

    var url = 'https://test.com/';
    var referrer = 'http://example.org';

    var requestFilter = new adguard.RequestFilter();

    var rule = new adguard.rules.UrlFilterRule('||test.com^');
    var whitelist = new adguard.rules.UrlFilterRule('@@||test.com^');
    var important = new adguard.rules.UrlFilterRule('||test.com^$important');
    var documentRule = new adguard.rules.UrlFilterRule('@@||example.org^$document');

    assert.ok(rule.isFiltered(url, true, RequestTypes.IMAGE));
    assert.ok(whitelist.isFiltered(url, true, RequestTypes.IMAGE));
    assert.ok(important.isFiltered(url, true, RequestTypes.IMAGE));
    assert.ok(documentRule.isFiltered(referrer, true, RequestTypes.DOCUMENT));

    var result;

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

QUnit.test('CSP rules', function (assert) {
    var requestFilter = new adguard.RequestFilter();

    var cspRule = new adguard.rules.UrlFilterRule('||xpanama.net^$third-party,csp=connect-src \'none\',domain=~example.org|merriam-webster.com');
    requestFilter.addRule(cspRule);

    var rules = requestFilter.findCspRules('https://nop.xpanama.net/if.html?adflag=1&cb=kq4iOggNyP', 'https://www.merriam-webster.com/', adguard.RequestTypes.DOCUMENT);
    assert.ok(rules.length === 1);
    assert.equal(rules[0].ruleText, cspRule.ruleText);

    rules = requestFilter.findCspRules('https://xpanama.net', 'https://example.org', adguard.RequestTypes.DOCUMENT);
    assert.ok(!rules || rules.length === 0);

    // Add matching directive whitelist rule
    var directiveWhiteListRule = new adguard.rules.UrlFilterRule('@@||xpanama.net^$csp=connect-src \'none\'');
    requestFilter.addRule(directiveWhiteListRule);
    rules = requestFilter.findCspRules('https://xpanama.net', 'https://www.merriam-webster.com/', adguard.RequestTypes.DOCUMENT);
    // Specific whitelist rule should be returned
    assert.ok(rules.length === 1);
    assert.equal(rules[0].ruleText, directiveWhiteListRule.ruleText);

    // Add global whitelist rule
    var globalWhiteListRule = new adguard.rules.UrlFilterRule('@@||xpanama.net^$csp');
    requestFilter.addRule(globalWhiteListRule);
    rules = requestFilter.findCspRules('https://xpanama.net', 'https://www.merriam-webster.com/', adguard.RequestTypes.DOCUMENT);
    // Global whitelist rule should be returned
    assert.ok(rules.length === 1);
    assert.equal(rules[0].ruleText, globalWhiteListRule.ruleText);
    requestFilter.removeRule(directiveWhiteListRule);
    requestFilter.removeRule(globalWhiteListRule);

    // Add whitelist rule, but with not matched directive
    var directiveMissWhiteListRule = new adguard.rules.UrlFilterRule('@@||xpanama.net^$csp=frame-src \'none\'');
    requestFilter.addRule(directiveMissWhiteListRule);
    rules = requestFilter.findCspRules('https://xpanama.net', 'https://www.merriam-webster.com/', adguard.RequestTypes.DOCUMENT);
    assert.ok(rules.length === 1);
    assert.equal(rules[0].ruleText, cspRule.ruleText);

    // Add CSP rule with duplicated directive
    var duplicateCspRule = new adguard.rules.UrlFilterRule('||xpanama.net^$third-party,csp=connect-src \'none\'');
    requestFilter.addRule(duplicateCspRule);
    rules = requestFilter.findCspRules('https://xpanama.net', 'https://www.merriam-webster.com/', adguard.RequestTypes.DOCUMENT);
    assert.ok(rules.length === 1);
    assert.ok(rules[0].ruleText === cspRule.ruleText || rules[0].ruleText === duplicateCspRule.ruleText);

    // Test request type matching
    requestFilter = new adguard.RequestFilter();

    var cspRuleSubDocument = new adguard.rules.UrlFilterRule('||xpanama.net^$csp=connect-src http:,domain=merriam-webster.com,subdocument');
    var cspRuleNotSubDocument = new adguard.rules.UrlFilterRule('||xpanama.net^$csp=connect-src \'none\',domain=merriam-webster.com,~subdocument');
    var cspRuleAny = new adguard.rules.UrlFilterRule('||xpanama.net^$csp=frame-src \'none\',domain=merriam-webster.com');
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

QUnit.test('Test CSP invalid rules', function (assert) {
    // Invalid csp rules
    var invalidRule = adguard.rules.builder.createRule('||$csp=report-uri /csp-violation-report-endpoint/', 1);
    assert.ok(!invalidRule);

    invalidRule = adguard.rules.builder.createRule('||$csp=report-to /csp-violation-report-endpoint/', 1);
    assert.ok(!invalidRule);

    var correctRule = adguard.rules.builder.createRule('||$csp=frame-src \'none\',subdocument', 1);
    assert.ok(correctRule);

    correctRule = adguard.rules.builder.createRule('||$csp=frame-src \'none\',~subdocument', 1);
    assert.ok(correctRule);

    correctRule = adguard.rules.builder.createRule('||$csp=frame-src \'none\'', 1);
    assert.ok(correctRule);
});

QUnit.test('Test CSP important rules', function (assert) {
    // Test important rules
    var requestFilter = new adguard.RequestFilter();

    var globalWhiteListRule = new adguard.rules.UrlFilterRule('@@||xpanama.net^$csp,domain=merriam-webster.com');
    var directiveWhiteListRule = new adguard.rules.UrlFilterRule('@@||xpanama.net^$csp=frame-src \'none\',domain=merriam-webster.com');
    var importantDirectiveWhiteListRule = new adguard.rules.UrlFilterRule('@@||xpanama.net^$csp=frame-src \'none\',domain=merriam-webster.com,important');
    var defaultCspRule = new adguard.rules.UrlFilterRule('||xpanama.net^$csp=frame-src \'none\',domain=merriam-webster.com');
    var importantCspRule = new adguard.rules.UrlFilterRule('||xpanama.net^$csp=frame-src \'none\',domain=merriam-webster.com,important');
    requestFilter.addRule(importantDirectiveWhiteListRule);
    requestFilter.addRule(importantCspRule);
    requestFilter.addRule(defaultCspRule);
    requestFilter.addRule(globalWhiteListRule);
    requestFilter.addRule(directiveWhiteListRule);

    var rules = requestFilter.findCspRules('https://nop.xpanama.net/if.html?adflag=1&cb=kq4iOggNyP', 'https://www.merriam-webster.com/', adguard.RequestTypes.DOCUMENT) || [];
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

QUnit.test("Cookie rules", function (assert) {

    var requestFilter = new adguard.RequestFilter();

    var cookieRule = new adguard.rules.UrlFilterRule('||xpanama.net^$third-party,cookie=c_user,domain=~example.org|merriam-webster.com');
    requestFilter.addRule(cookieRule);

    var rules = requestFilter.findCookieRules('https://nop.xpanama.net/if.html?adflag=1&cb=kq4iOggNyP', 'https://www.merriam-webster.com/', adguard.RequestTypes.DOCUMENT);
    assert.ok(rules.length === 1);
    assert.equal(rules[0].ruleText, cookieRule.ruleText);

    //TODO: Add cases and other tests
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

QUnit.test('Test object subrequest type', function (assert) {
    var requestFilter = new adguard.RequestFilter();

    var rule1 = new adguard.rules.UrlFilterRule('blockrequest1$object-subrequest');
    var rule2 = new adguard.rules.UrlFilterRule('blockrequest2$object_subrequest');
    var rule3 = new adguard.rules.UrlFilterRule('blockrequest3$~object-subrequest');
    var rule4 = new adguard.rules.UrlFilterRule('blockrequest4$~object_subrequest');

    requestFilter.addRule(rule1);
    requestFilter.addRule(rule2);
    requestFilter.addRule(rule3);
    requestFilter.addRule(rule4);

    assert.ok(requestFilter.findRuleForRequest('blockrequest1', '', adguard.RequestTypes.OBJECT_SUBREQUEST));
    assert.ok(requestFilter.findRuleForRequest('blockrequest2', '', adguard.RequestTypes.OBJECT_SUBREQUEST));
    assert.notOk(requestFilter.findRuleForRequest('blockrequest3', '', adguard.RequestTypes.OBJECT_SUBREQUEST));
    assert.notOk(requestFilter.findRuleForRequest('blockrequest4', '', adguard.RequestTypes.OBJECT_SUBREQUEST));
});

QUnit.test('BadFilter option', function (assert) {
    var rule = new adguard.rules.UrlFilterRule('https:*_ad_');
    var ruleTwo = new adguard.rules.UrlFilterRule('https:*_da_');
    var ruleThree = new adguard.rules.UrlFilterRule('https:*_ad_$match-case');
    var badFilterRule = new adguard.rules.UrlFilterRule('https:*_ad_$badfilter');

    var requestFilter = new adguard.RequestFilter();

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

QUnit.test('BadFilter option whitelist', function (assert) {
    var url = 'https://test.com/';
    var referrer = 'http://example.org';

    var rule = new adguard.rules.UrlFilterRule('||test.com^');
    var whitelist = new adguard.rules.UrlFilterRule('@@||test.com^');
    var badFilterRule = new adguard.rules.UrlFilterRule('@@||test.com^$badfilter');

    var requestFilter = new adguard.RequestFilter();

    requestFilter.addRule(rule);

    var result = requestFilter.findRuleForRequest(url, referrer, adguard.RequestTypes.SUBDOCUMENT);
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
    var rule = new adguard.rules.UrlFilterRule('||example.org^$object-subrequest');
    var ruleTwo = new adguard.rules.UrlFilterRule('||example.org^');
    var badFilterRule = new adguard.rules.UrlFilterRule('||example.org^$badfilter,object-subrequest');

    var requestFilter = new adguard.RequestFilter();

    requestFilter.addRule(rule);
    requestFilter.addRule(ruleTwo);

    assert.ok(requestFilter.findRuleForRequest('https://example.org', '', adguard.RequestTypes.OBJECT_SUBREQUEST));
    assert.ok(requestFilter.findRuleForRequest('https://example.org', '', adguard.RequestTypes.SUBDOCUMENT));


    requestFilter.addRule(badFilterRule);
    assert.ok(requestFilter.findRuleForRequest('https://example.org', '', adguard.RequestTypes.OBJECT_SUBREQUEST));
    assert.ok(requestFilter.findRuleForRequest('https://example.org', '', adguard.RequestTypes.SUBDOCUMENT));
    assert.strictEqual(ruleTwo, requestFilter.findRuleForRequest('https://example.org', '', adguard.RequestTypes.OBJECT_SUBREQUEST));
    assert.strictEqual(ruleTwo, requestFilter.findRuleForRequest('https://example.org', '', adguard.RequestTypes.SUBDOCUMENT));

    requestFilter.removeRule(badFilterRule);

    assert.ok(requestFilter.findRuleForRequest('https://example.org', '', adguard.RequestTypes.OBJECT_SUBREQUEST));
    assert.ok(requestFilter.findRuleForRequest('https://example.org', '', adguard.RequestTypes.SUBDOCUMENT));


    badFilterRule = new adguard.rules.UrlFilterRule('||example.org^$object-subrequest,badfilter');

    requestFilter.addRule(badFilterRule);

    assert.ok(requestFilter.findRuleForRequest('https://example.org', '', adguard.RequestTypes.OBJECT_SUBREQUEST));
    assert.ok(requestFilter.findRuleForRequest('https://example.org', '', adguard.RequestTypes.SUBDOCUMENT));
    assert.strictEqual(ruleTwo, requestFilter.findRuleForRequest('https://example.org', '', adguard.RequestTypes.OBJECT_SUBREQUEST));
    assert.strictEqual(ruleTwo, requestFilter.findRuleForRequest('https://example.org', '', adguard.RequestTypes.SUBDOCUMENT));

    requestFilter.removeRule(badFilterRule);

    assert.ok(requestFilter.findRuleForRequest('https://example.org', '', adguard.RequestTypes.OBJECT_SUBREQUEST));
    assert.ok(requestFilter.findRuleForRequest('https://example.org', '', adguard.RequestTypes.SUBDOCUMENT));
});

QUnit.test('BadFilter doesn stop looking for other rules', (assert) => {
    const rule = new adguard.rules.UrlFilterRule('||example.org^$third-party');
    const ruleTwo = new adguard.rules.UrlFilterRule('||example.org^$xmlhttprequest');
    var badFilterRule = new adguard.rules.UrlFilterRule('||example.org^$third-party,badfilter');

    var requestFilter = new adguard.RequestFilter();

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

QUnit.test('Replace filters', function (assert) {
    const rules = [
        '||example.org^$replace=/test/test1/g',
        '||example.org^$replace=/test1/test2/g',
    ];

    const requestFilter = new adguard.RequestFilter();

    adguard.prefs.features.responseContentFilteringSupported = true;

    const urlFilterRules = rules.map(rule => {
        return new adguard.rules.UrlFilterRule(rule);
    });

    requestFilter.addRules(urlFilterRules);

    const replaceRules = requestFilter.findReplaceRules('https://example.org', '', adguard.RequestTypes.DOCUMENT);

    assert.ok(replaceRules);
    assert.equal(replaceRules.length, rules.length);
});

QUnit.test('whitelisted replace filter with same option is omitted', function (assert) {

    const expectedRule = '||example.org^$replace=/test/test1/g';

    const rules = [
        expectedRule,
        '||example.org^$replace=/test1/test2/g',
        '@@||example.org^$replace=/test1/test2/g',
    ];

    const requestFilter = new adguard.RequestFilter();

    adguard.prefs.features.responseContentFilteringSupported = true;

    const urlFilterRules = rules.map(rule => {
        return new adguard.rules.UrlFilterRule(rule);
    });

    requestFilter.addRules(urlFilterRules);

    const replaceRules = requestFilter.findReplaceRules('https://example.org', '', adguard.RequestTypes.DOCUMENT);

    assert.ok(replaceRules);
    assert.equal(replaceRules.length, 2);
});

QUnit.test('whitelist rules with $stealth modifier', function (assert) {
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

QUnit.test('whitelist rules with $stealth and $script modifier', function (assert) {
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

QUnit.test('whitelist rules with $stealth and $third-party modifier', function (assert) {
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

QUnit.test('replace filter with empty $replace modifier should remove all other replace rules', function (assert) {
    const rules = [
        '||example.org^$replace=/test/test1/g',
        '||example.org^$replace=/test1/test2/g',
        '@@||example.org^$replace',
    ];

    const requestFilter = new adguard.RequestFilter();

    adguard.prefs.features.responseContentFilteringSupported = true;

    const urlFilterRules = rules.map(rule => {
        return new adguard.rules.UrlFilterRule(rule);
    });

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

QUnit.test('stealth rules with $badfilter modifier', function (assert) {

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


// https://github.com/AdguardTeam/AdguardBrowserExtension/issues/1122
QUnit.test('Rule with extension modifier should be omitted in request filter', function (assert) {
    const rules = [
        '@@||example.org^$extension',
        '||example.org/favicon.ico',
        '||example.org/badcode.js',
    ];

    const requestFilter = new adguard.RequestFilter();

    const urlFilterRules = rules.map(rule => {
        return new adguard.rules.UrlFilterRule(rule);
    });

    requestFilter.addRules(urlFilterRules);

    const requesRulesLength = requestFilter.getRules().length;

    assert.equal(requesRulesLength, rules.length - 1);
});

QUnit.test('requestFilter.findRuleForRequest performance', function (assert) {
    var rules = filtersFromTxt; // variable filtersFromTxt is from 'test_filter.js'
    var requestFilter = new adguard.RequestFilter();
    for (var i = 0; i < rules.length; i++) {
        var rule = adguard.rules.builder.createRule(rules[i], adguard.utils.filters.USER_FILTER_ID);
        if (rule) {
            requestFilter.addRule(rule);
        }
    }

    var url = 'https://www.youtube.com/gaming';
    var referrer = 'http://example.org';

    var count = 50000;
    var startTime = new Date().getTime();
    var results = [];
    for (var k = 0; k < count; k++) {
        requestFilter.findRuleForRequest(url, referrer, adguard.RequestTypes.SUBDOCUMENT);
    }

    var elapsed = new Date().getTime() - startTime;
    assert.ok(elapsed > 0);

    console.log('------------------------------------START TEST PERFORMANCE-----------------------------------');
    console.log('Total: ' + elapsed + ' ms');
    console.log('Average: ' + elapsed / count + ' ms');
    console.log('------------------------------------END TEST PERFORMANCE-----------------------------------');

    // Total: 84 ms
    // Average: 0.00168 ms
});

QUnit.test('Test scriptlet adguard rule', function (assert) {
    const rule = "example.org#%#//scriptlet('abort-on-property-read', 'I10C')";
    const exp = "example.org#%#//scriptlet('abort-on-property-read', 'I10C')";
    const res = adguard.rules.ruleConverter.convertRule(rule);
    assert.equal(res, exp);
});
QUnit.test('Test scriptlet adguard rule exception', function (assert) {
    const rule = "example.org#@%#//scriptlet('abort-on-property-read', 'I10C')";
    const exp = "example.org#@%#//scriptlet('abort-on-property-read', 'I10C')";
    const res = adguard.rules.ruleConverter.convertRule(rule);
    assert.equal(res, exp);
});
QUnit.test('Test converter scriptlet ubo rule', function (assert) {
    const rule = "example.org##+js(setTimeout-defuser.js, [native code], 8000)";
    const exp = 'example.org#%#//scriptlet("ubo-setTimeout-defuser.js", "[native code]", "8000")';
    const res = adguard.rules.ruleConverter.convertRule(rule);
    assert.equal(res, exp);
});
QUnit.test('Test converter scriptlet abp rule', function (assert) {
    const rule = "example.org#$#hide-if-contains li.serp-item 'li.serp-item div.label'";
    const exp = 'example.org#%#//scriptlet("abp-hide-if-contains", "li.serp-item", "li.serp-item div.label")';
    const res = adguard.rules.ruleConverter.convertRule(rule);
    assert.equal(res, exp);
});
QUnit.test('Test converter scriptlet multiple abp rule', function (assert) {
    const rule = `example.org#$#hide-if-has-and-matches-style 'd[id^="_"]' 'div > s' 'display: none'; hide-if-contains /.*/ .p 'a[href^="/ad__c?"]'`;
    const exp1 = 'example.org#%#//scriptlet("abp-hide-if-has-and-matches-style", "d[id^=\\"_\\"]", "div > s", "display: none")';
    const exp2 = 'example.org#%#//scriptlet("abp-hide-if-contains", "/.*/", ".p", "a[href^=\\"/ad__c?\\"]")';
    const res = adguard.rules.ruleConverter.convertRule(rule);

    assert.equal(res.length, 2);
    assert.equal(res[0], exp1);
    assert.equal(res[1], exp2);
});

QUnit.test('Test converter css adguard rule', (assert) => {
    const rule = 'firmgoogle.com#$#.pub_300x250 {display:block!important;}';
    const exp = 'firmgoogle.com#$#.pub_300x250 {display:block!important;}';
    const res = adguard.rules.ruleConverter.convertRule(rule);

    assert.equal(res, exp, 'the issue of this test that adg css rule and abp snippet rule has the same mask, but different content');

    // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/1412
    const whitelistCssRule = 'example.com#@$#h1 { display: none!important; }';
    const expected = 'example.com#@$#h1 { display: none!important; }';
    const actual = adguard.rules.ruleConverter.convertRule(whitelistCssRule);
    assert.equal(actual, expected, 'AG CSS whitelist rules should not be parsed as ABP scriptlet rule');
});

QUnit.test('Composite rules', (assert) => {
    const requestFilter = new adguard.RequestFilter();
    const rule = `example.org#$#hide-if-has-and-matches-style 'd[id^="_"]' 'div > s' 'display: none'; hide-if-contains /.*/ .p 'a[href^="/ad__c?"]'`;
    const compositeRule = adguard.rules.builder.createRule(rule, 0);

    assert.ok(compositeRule);
    assert.ok(compositeRule instanceof adguard.rules.CompositeRule);

    requestFilter.addRule(compositeRule);
    const rules = requestFilter.getRules();
    assert.equal(rules.length, 2);

    requestFilter.removeRule(compositeRule);
    const rules1 = requestFilter.getRules();
    assert.equal(rules1, 0);
});

QUnit.test('Comments in rule', (assert) => {
    let rule = adguard.rules.builder.createRule('! example.com#$#.pub_300x250 {display:block!important;}', 0);
    assert.notOk(rule, 'rule with comment mask should return null');

    rule = adguard.rules.builder.createRule('! ain.ua#$#body - удаление брендированного фона, отступа сверху', 0);
    assert.notOk(rule, 'rule with comment mask should return null');
});

QUnit.test('Converts ABP rules into AG compatible rule', (assert) => {
    let actual = adguard.rules.ruleConverter.convertRule('||e9377f.com^$rewrite=abp-resource:blank-mp3,domain=eastday.com');
    let expected = '||e9377f.com^$redirect=blank-mp3,domain=eastday.com';
    assert.equal(actual, expected);

    actual = adguard.rules.ruleConverter.convertRule('||lcok.net/2019/ad/$domain=huaren.tv,rewrite=abp-resource:blank-mp3');
    expected = '||lcok.net/2019/ad/$domain=huaren.tv,redirect=blank-mp3';
    assert.equal(actual, expected);

    actual = adguard.rules.ruleConverter.convertRule('||lcok.net/2019/ad/$domain=huaren.tv');
    expected = '||lcok.net/2019/ad/$domain=huaren.tv';
    assert.equal(actual, expected);
});

QUnit.test('converts empty and mp4 modifiers into redirect rules', (assert) => {
    let actual = adguard.rules.ruleConverter.convertRule('/(pagead2)/$domain=vsetv.com,empty,important');
    let expected = '/(pagead2)/$domain=vsetv.com,redirect=noopjs,important';
    assert.equal(actual, expected);

    actual = adguard.rules.ruleConverter.convertRule('||fastmap33.com^$empty');
    expected = '||fastmap33.com^$redirect=noopjs';
    assert.equal(actual, expected);

    actual = adguard.rules.ruleConverter.convertRule('||anyporn.com/xml^$media,mp4');
    expected = adguard.rules.ruleConverter.convertRule('||anyporn.com/xml^$media,redirect=noopmp4-1s');
    assert.equal(actual, expected);
});
