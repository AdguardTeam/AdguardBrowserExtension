/* global QUnit */

QUnit.test('Punycode rules', (assert) => {
    // "||яндекс.рф^$third-party,domain=почта.рф";
    const ruleText = decodeURIComponent('%7C%7C%D1%8F%D0%BD%D0%B4%D0%B5%D0%BA%D1%81.%D1%80%D1%84%5E%24third-party%2Cdomain%3D%D0%BF%D0%BE%D1%87%D1%82%D0%B0.%D1%80%D1%84');
    const rule = new adguard.rules.UrlFilterRule(ruleText);
    assert.ok(rule);

    assert.equal('^(http|https|ws|wss)://([a-z0-9-_.]+\\.)?xn--d1acpjx3f\\.xn--p1ai([^ a-zA-Z0-9.%_-]|$)', rule.getUrlRegExpSource());
    assert.equal('/^(http|https|ws|wss):\\/\\/([a-z0-9-_.]+\\.)?xn--d1acpjx3f\\.xn--p1ai([^ a-zA-Z0-9.%_-]|$)/i', rule.getUrlRegExp().toString());
    assert.equal('xn--80a1acny.xn--p1ai', rule.getPermittedDomains()[0]);
});

QUnit.test('Whitelist rule', (assert) => {
    const ruleText = '@@||tradedoubler.com/anet?type(iframe)loc($subdocument,domain=topzone.lt';
    const rule = new adguard.rules.UrlFilterRule(ruleText);

    assert.ok(rule);
    assert.ok(rule.whiteListRule);
    assert.notOk(rule.isMatchCase());
    assert.notOk(rule.isThirdParty());
    assert.notOk(rule.isCheckThirdParty());
    assert.ok(rule.getPermittedDomains().indexOf('topzone.lt') >= 0);
    assert.equal('^(http|https|ws|wss)://([a-z0-9-_.]+\\.)?tradedoubler\\.com\\/anet\\?type\\(iframe\\)loc\\(', rule.getUrlRegExpSource());
    assert.equal('/^(http|https|ws|wss):\\/\\/([a-z0-9-_.]+\\.)?tradedoubler\\.com\\/anet\\?type\\(iframe\\)loc\\(/i', rule.getUrlRegExp().toString());
});

QUnit.test('Generic rule', (assert) => {
    const domain2RuleText = '||test.ru/$script,domain=test2.ru';
    const domain3RuleText = 'test/$script,domain=test2.ru';
    const domain5RuleText = 'test/$script,domain=test1.ru|~test2.ru';

    const generic1RuleText = '/generic';
    const generic2RuleText = '/generic$domain=~test2.ru';
    const generic3RuleText = '-460x68.';
    const generic4RuleText = 'generic';
    const generic5RuleText = '~generic.com';
    const generic6RuleText = '||test.ru/$script';
    const generic7RuleText = 'test.ru/$domain=~test2.ru';
    const generic8RuleText = '||retarget.ssl-services.com^$third-party';

    let rule = new adguard.rules.UrlFilterRule(generic1RuleText);
    assert.ok(rule);
    assert.ok(rule.isGeneric());

    rule = new adguard.rules.UrlFilterRule(generic2RuleText);
    assert.ok(rule);
    assert.ok(rule.isGeneric());

    rule = new adguard.rules.UrlFilterRule(generic3RuleText);
    assert.ok(rule);
    assert.ok(rule.isGeneric());

    rule = new adguard.rules.UrlFilterRule(generic4RuleText);
    assert.ok(rule);
    assert.ok(rule.isGeneric());

    rule = new adguard.rules.UrlFilterRule(generic5RuleText);
    assert.ok(rule);
    assert.ok(rule.isGeneric());

    rule = new adguard.rules.UrlFilterRule(generic6RuleText);
    assert.ok(rule);
    assert.ok(rule.isGeneric());

    rule = new adguard.rules.UrlFilterRule(generic7RuleText);
    assert.ok(rule);
    assert.ok(rule.isGeneric());

    rule = new adguard.rules.UrlFilterRule(generic8RuleText);
    assert.ok(rule);
    assert.ok(rule.isGeneric());


    rule = new adguard.rules.UrlFilterRule(domain2RuleText);
    assert.ok(rule);
    assert.notOk(rule.isGeneric());

    rule = new adguard.rules.UrlFilterRule(domain3RuleText);
    assert.ok(rule);
    assert.notOk(rule.isGeneric());

    rule = new adguard.rules.UrlFilterRule(domain5RuleText);
    assert.ok(rule);
    assert.notOk(rule.isGeneric());
});

QUnit.test('Generic domain specific', (assert) => {
    const { RequestTypes } = adguard;

    // Domain specific rule
    const ruleText = '||cdn.innity.net^$domain=sharejunction.com';
    const rule = new adguard.rules.UrlFilterRule(ruleText);

    assert.ok(rule);
    assert.notOk(rule.isMatchCase());
    assert.notOk(rule.isThirdParty());
    assert.notOk(rule.isGeneric());

    let filter = new adguard.rules.UrlFilter([rule]);
    assert.ok(filter.isFiltered('http://cdn.innity.net/admanager.js', 'sharejunction.com', RequestTypes.SCRIPT, true) !== null);

    // var genericBlockRuleText = "@@||sharejunction.com^$genericblock,generichide";
    // var genericBlockRule = new adguard.rules.UrlFilterRule(genericBlockRuleText);

    let filtered = filter.isFiltered('http://cdn.innity.net/admanager.js', 'sharejunction.com', RequestTypes.SCRIPT, true, true);
    assert.ok(filtered !== null);
    assert.notOk(filtered.whiteListRule);


    // Generic rule
    const genericRuleText = '||innity.net^$third-party';
    const genericRule = new adguard.rules.UrlFilterRule(genericRuleText);

    assert.notOk(genericRule.isMatchCase());
    assert.ok(genericRule.isThirdParty());
    assert.ok(genericRule.isGeneric());

    // Should be blocked by generic
    filter = new adguard.rules.UrlFilter([genericRule]);
    filtered = filter.isFiltered('http://cdn.innity.net/admanager.js', 'sharejunction.com', RequestTypes.SCRIPT, true);
    assert.ok(filtered !== null);

    // Should be whitelisted by generic block
    filtered = filter.isFiltered('http://cdn.innity.net/admanager.js', 'sharejunction.com', RequestTypes.SCRIPT, true, true);
    assert.notOk(filtered !== null);


    // 2 rules together
    // Should be blocked by domain specific
    filter = new adguard.rules.UrlFilter([rule, genericRule]);
    filtered = filter.isFiltered('http://cdn.innity.net/admanager.js', 'sharejunction.com', RequestTypes.SCRIPT, true, true);
    assert.ok(filtered !== null);
});

QUnit.test('Url blocking rule without domain', (assert) => {
    const ruleText = '-460x68.';
    const rule = new adguard.rules.UrlFilterRule(ruleText);

    assert.ok(rule);
    assert.notOk(rule.isMatchCase());
    assert.notOk(rule.isThirdParty());
    assert.notOk(rule.isCheckThirdParty());
});

QUnit.test('Url blocking rule', (assert) => {
    const { RequestTypes } = adguard;

    const ruleText = '||test.ru/^$domain=~nigma.ru|google.com,third-party,match-case,popup';
    const rule = new adguard.rules.UrlFilterRule(ruleText);

    // Check rule properties
    assert.ok(rule.isMatchCase());
    assert.ok(rule.isThirdParty());
    assert.ok(rule.isCheckThirdParty());
    assert.equal('test.ru/', rule.shortcut);
    assert.equal('google.com', rule.getPermittedDomains()[0]);
    assert.equal('nigma.ru', rule.getRestrictedDomains()[0]);
    assert.equal('^(http|https|ws|wss)://([a-z0-9-_.]+\\.)?test\\.ru\\/([^ a-zA-Z0-9.%_-]|$)', rule.getUrlRegExpSource());
    assert.equal('/^(http|https|ws|wss):\\/\\/([a-z0-9-_.]+\\.)?test\\.ru\\/([^ a-zA-Z0-9.%_-]|$)/', rule.getUrlRegExp().toString());

    // Check rule work
    assert.ok(rule.isBlockPopups());
    assert.ok(rule.isFiltered('http://test.ru/', true, RequestTypes.DOCUMENT));
    assert.notOk(rule.isFiltered('http://test.ru/', true, RequestTypes.SUBDOCUMENT));
    assert.notOk(rule.isFiltered('http://TEst.ru/', false, RequestTypes.SUBDOCUMENT));
    assert.notOk(rule.isFiltered('http://test.ru', true, RequestTypes.SUBDOCUMENT));
    assert.ok(rule.isPermitted('google.com'));
    assert.ok(rule.isPermitted('www.google.com'));
    assert.notOk(rule.isPermitted('nigma.ru'));
    assert.notOk(rule.isPermitted('www.nigma.ru'));
});

QUnit.test('Content-specific URL blocking', (assert) => {
    const { RequestTypes } = adguard;

    let mask = '||test.ru/$script';
    let rule = new adguard.rules.UrlFilterRule(mask);
    assert.ok(rule.isFiltered('http://test.ru/script.js?ololo=ololo', false, RequestTypes.SCRIPT));
    assert.notOk(rule.isFiltered('http://test.ru/script.js?ololo=ololo', false, RequestTypes.XMLHTTPREQUEST));
    assert.notOk(rule.isFiltered('http://test.ru/?ololo=ololo', false, RequestTypes.SUBDOCUMENT));
    assert.notOk(rule.isFiltered('http://test.ru/image.png', false, RequestTypes.IMAGE));

    mask = '||test.ru/$~script';
    rule = new adguard.rules.UrlFilterRule(mask);
    assert.notOk(rule.isFiltered('http://test.ru/script.js?ololo=ololo', false, RequestTypes.SCRIPT));
    assert.ok(rule.isFiltered('http://test.ru/script.js?ololo=ololo', false, RequestTypes.XMLHTTPREQUEST));
    assert.ok(rule.isFiltered('http://test.ru/?ololo=ololo', false, RequestTypes.SUBDOCUMENT));
    assert.ok(rule.isFiltered('http://test.ru/image.png', false, RequestTypes.IMAGE));
    assert.ok(rule.isFiltered('ws://test.ru/?ololo=ololo', false, RequestTypes.WEBSOCKET));

    mask = '||test.ru/$script,image';
    rule = new adguard.rules.UrlFilterRule(mask);
    assert.ok(rule.isFiltered('http://test.ru/script.js?ololo=ololo', false, RequestTypes.SCRIPT));
    assert.ok(rule.isFiltered('http://test.ru/image.png', false, RequestTypes.IMAGE));
    assert.notOk(rule.isFiltered('http://test.ru/?ololo=ololo', false, RequestTypes.SUBDOCUMENT));
    assert.notOk(rule.isFiltered('http://test.ru/?ololo=ololo', false, RequestTypes.XMLHTTPREQUEST));
    assert.notOk(rule.isFiltered('wss://test.ru/?ololo=ololo', false, RequestTypes.WEBSOCKET));

    mask = '||test.ru/$~script,~image';
    rule = new adguard.rules.UrlFilterRule(mask);
    assert.notOk(rule.isFiltered('http://test.ru/script.js?ololo=ololo', false, RequestTypes.SCRIPT));
    assert.ok(rule.isFiltered('http://test.ru/script.js?ololo=ololo', false, RequestTypes.XMLHTTPREQUEST));
    assert.ok(rule.isFiltered('http://test.ru/?ololo=ololo', false, RequestTypes.SUBDOCUMENT));
    assert.notOk(rule.isFiltered('http://test.ru/image.png', false, RequestTypes.IMAGE));

    mask = '||test.ru/$~script,image';
    rule = new adguard.rules.UrlFilterRule(mask);
    assert.notOk(rule.isFiltered('http://test.ru/script.js?ololo=ololo', false, RequestTypes.SCRIPT));
    assert.notOk(rule.isFiltered('http://test.ru/script.js?ololo=ololo', false, RequestTypes.XMLHTTPREQUEST));
    assert.notOk(rule.isFiltered('http://test.ru/?ololo=ololo', false, RequestTypes.SUBDOCUMENT));
    assert.ok(rule.isFiltered('http://test.ru/image.png', false, RequestTypes.IMAGE));
    assert.notOk(rule.isFiltered('http://test.ru/image.png', false, RequestTypes.XMLHTTPREQUEST));

    mask = '||test.ru/$script,image,xmlhttprequest';
    rule = new adguard.rules.UrlFilterRule(mask);
    assert.ok(rule.isFiltered('http://test.ru/script.js?ololo=ololo', false, RequestTypes.SCRIPT));
    assert.notOk(rule.isFiltered('http://test.ru/?ololo=ololo', false, RequestTypes.SUBDOCUMENT));
    assert.ok(rule.isFiltered('http://test.ru/?ololo=ololo', false, RequestTypes.XMLHTTPREQUEST));
    assert.ok(rule.isFiltered('http://test.ru/image.png', false, RequestTypes.IMAGE));

    mask = '||test.ru/$websocket';
    rule = new adguard.rules.UrlFilterRule(mask);
    assert.ok(rule.isFiltered('ws://test.ru/?ololo=ololo', false, RequestTypes.WEBSOCKET));
    assert.notOk(rule.isFiltered('http://test.ru/?ololo=ololo', false, RequestTypes.SUBDOCUMENT));
    assert.notOk(rule.isFiltered('http://test.ru/?ololo=ololo', false, RequestTypes.OTHER));

    mask = 'stun:test.ru$webrtc';
    rule = new adguard.rules.UrlFilterRule(mask);
    assert.ok(rule.isFiltered('stun:test.ru:19302/?ololo=ololo', false, RequestTypes.WEBRTC));
    assert.notOk(rule.isFiltered('ws://test.ru/?ololo=ololo', false, RequestTypes.WEBSOCKET));
    assert.notOk(rule.isFiltered('http://test.ru/?ololo=ololo', false, RequestTypes.SUBDOCUMENT));
    assert.notOk(rule.isFiltered('http://test.ru/?ololo=ololo', false, RequestTypes.OTHER));

    mask = '@@||test.ru$content,jsinject';
    rule = new adguard.rules.UrlFilterRule(mask);
    assert.ok(rule.isContent());
    assert.ok(rule.isJsInject());
    assert.notOk(rule.isDocumentWhiteList());
    assert.ok(rule.isFiltered('http://test.ru', false, RequestTypes.DOCUMENT));
    assert.notOk(rule.isFiltered('http://test.ru/script.js', false, RequestTypes.SCRIPT));

    mask = '@@||test.ru$content';
    rule = new adguard.rules.UrlFilterRule(mask);
    assert.ok(rule.isContent());
    assert.notOk(rule.isJsInject());
    assert.notOk(rule.isDocumentWhiteList());
    assert.ok(rule.isFiltered('http://test.ru', false, RequestTypes.DOCUMENT));
    assert.notOk(rule.isFiltered('http://test.ru/script.js', false, RequestTypes.SCRIPT));
});

QUnit.test('Ping specific request is blocked', (assert) => {
    const ruleText = 'example.org$ping';
    const rule = new adguard.rules.UrlFilterRule(ruleText, 1);
    assert.ok(rule.isFiltered('http://example.org/', false, adguard.RequestTypes.PING));
    assert.notOk(rule.isFiltered('http://example.org/', false, adguard.RequestTypes.DOCUMENT));
    assert.notOk(rule.isFiltered('http://example.org/', false, adguard.RequestTypes.SUBDOCUMENT));
    assert.notOk(rule.isFiltered('http://example.org/', false, adguard.RequestTypes.SCRIPT));
    assert.notOk(rule.isFiltered('http://example.org/', false, adguard.RequestTypes.WEBSOCKET));
    assert.notOk(rule.isFiltered('http://example.org/', false, adguard.RequestTypes.OTHER));
});

QUnit.test('UrlFilter class tests', (assert) => {
    const { RequestTypes } = adguard;

    const rule = new adguard.rules.UrlFilterRule('||test.ru/^$domain=~nigma.ru|google.com,third-party,match-case');
    const rule1 = new adguard.rules.UrlFilterRule('|http://www.google.com/ad/*');
    const rule2 = new adguard.rules.UrlFilterRule('/partner.$domain=~8088.ru|~partner.microsoft.com|~r01.ru|~yandex.ru');

    const filter = new adguard.rules.UrlFilter([rule, rule1, rule2]);

    assert.notOk(filter.isFiltered('http://test.ru/', 'test.test.ru', RequestTypes.SUBDOCUMENT, false) !== null);
    assert.ok(filter.isFiltered('http://test.ru/', 'www.google.com', RequestTypes.SCRIPT, true) !== null);
    assert.ok(filter.isFiltered('http://www.google.com/ad/advertisment', 'test.ru', RequestTypes.SUBDOCUMENT, true) !== null);
    assert.notOk(filter.isFiltered('http://test.ru/', 'www.nigma.ru', RequestTypes.SUBDOCUMENT, true) !== null);
    assert.ok(filter.isFiltered('http://partner.nekki.ru/banner.php?no_cache=41122&rotation_id=7', 'rutracker.org', RequestTypes.SUBDOCUMENT, true) !== null);
    assert.notOk(filter.isFiltered('http://partner.yandex.ru', 'yandex.ru', RequestTypes.SUBDOCUMENT, false) !== null);
});

QUnit.test('Regexp characters escaping', (assert) => {
    const rule = new adguard.rules.UrlFilterRule('imgur.com#@%#var addthis = { init: function() {}, addEventListener: function() {}, button: function() {}, counter: function() {} }');
    assert.ok(rule);
});

QUnit.test('Simple regexp rule', (assert) => {
    const { RequestTypes } = adguard;

    const mask = '/^https?/';
    const rule = new adguard.rules.UrlFilterRule(mask);
    assert.ok(rule.isFiltered('http://www.vmhadwuuj.com/v.js', true, RequestTypes.SCRIPT));
});

QUnit.test('Regexp rule', (assert) => {
    const { RequestTypes } = adguard;

    const mask = '/news/\\d+/$domain=~nigma.ru|lenta.ru';
    const rule = new adguard.rules.UrlFilterRule(mask);
    assert.ok(rule.isPermitted('lenta.ru'));
    assert.ok(rule.isFiltered('http://lenta.ru/news/2014/12/12/eurodollar/', false, RequestTypes.SUBDOCUMENT));
    assert.notOk(rule.isPermitted('adguard.com'));
    assert.notOk(rule.isPermitted('nigma.ru'));
    assert.notOk(rule.isFiltered('http://lenta.ru/news/a2014/12/12/eurodollar/', false, RequestTypes.SUBDOCUMENT));
    assert.notOk(rule.isFiltered('http://lenta.ru/news2014/12/12/eurodollar/', false, RequestTypes.SUBDOCUMENT));
});

QUnit.test('Complex regexp rule', (assert) => {
    const { RequestTypes } = adguard;

    const mask = '/^https?\\:\\/\\/(?!(connect\\.facebook\\.net|ajax\\.cloudflare\\.com|www\\.google-analytics\\.com|ajax\\.googleapis\\.com|fbstatic-a\\.akamaihd\\.net|stats\\.g\\.doubleclick\\.net|api-secure\\.solvemedia\\.com|api\\.solvemedia\\.com|sb\\.scorecardresearch\\.com|www\\.google\\.com)\\/)/$script,third-party,xmlhttprequest,domain=mediafire.com';
    const rule = new adguard.rules.UrlFilterRule(mask);
    assert.ok(rule.isFiltered('http://traratatata.com/blahblah.js', true, RequestTypes.SCRIPT));
    assert.notOk(rule.isFiltered('http://traratatata.com/blahblah.html', true, RequestTypes.SUBDOCUMENT));
    assert.ok(rule.isFiltered('http://traratatata.com/blahblah.html', true, RequestTypes.XMLHTTPREQUEST));
    assert.notOk(rule.isFiltered('http://connect.facebook.net/blahblah.js', true, RequestTypes.SCRIPT));
    assert.notOk(rule.isFiltered('https://ajax.cloudflare.com/blahblah.js', true, RequestTypes.SCRIPT));
    assert.notOk(rule.isFiltered('https://www.google-analytics.com/blahblah.js', true, RequestTypes.SCRIPT));
});

QUnit.test('Test UrlFilterRule Matching Everything', (assert) => {
    const { RequestTypes } = adguard;

    let rule = new adguard.rules.UrlFilterRule('*$domain=example.org');
    assert.ok(rule.isFiltered('http://test.com', true, RequestTypes.SUBDOCUMENT));

    rule = new adguard.rules.UrlFilterRule('$domain=example.org');
    assert.ok(rule.isFiltered('http://test.com', true, RequestTypes.SUBDOCUMENT));

    assert.throws(() => {
        rule = new adguard.rules.UrlFilterRule('*$websocket');
    }, /Too wide basic rule/, 'should throw error');
});

QUnit.test('Test UrlFilterRule Matching Any Url', (assert) => {
    let ruleText = '*$domain=test.com';
    let rule = new adguard.rules.UrlFilterRule(ruleText);

    assert.notOk(rule.isThirdParty());
    assert.ok(rule.getPermittedDomains());
    assert.equal(1, rule.getPermittedDomains().length);
    assert.notOk(rule.shortcut);
    assert.ok(rule.isRegexRule);
    assert.ok(rule.isFiltered('http://example.com', true, adguard.RequestTypes.SCRIPT));

    ruleText = '$domain=test.com';
    rule = new adguard.rules.UrlFilterRule(ruleText);

    assert.notOk(rule.isThirdParty());
    assert.ok(rule.getPermittedDomains());
    assert.equal(1, rule.getPermittedDomains().length);
    assert.notOk(rule.shortcut);
    assert.ok(rule.isRegexRule);
    assert.ok(rule.isFiltered('http://example.com', true, adguard.RequestTypes.SCRIPT));

    ruleText = '||$domain=test.com';
    rule = new adguard.rules.UrlFilterRule(ruleText);

    assert.notOk(rule.isThirdParty());
    assert.ok(rule.getPermittedDomains());
    assert.equal(1, rule.getPermittedDomains().length);
    assert.notOk(rule.shortcut);
    assert.ok(rule.isFiltered('http://example.com', true, adguard.RequestTypes.SCRIPT));

    ruleText = '|$domain=test.com';
    rule = new adguard.rules.UrlFilterRule(ruleText);

    assert.notOk(rule.isThirdParty());
    assert.ok(rule.getPermittedDomains());
    assert.equal(1, rule.getPermittedDomains().length);
    assert.notOk(rule.shortcut);
    assert.ok(rule.isFiltered('http://example.com', true, adguard.RequestTypes.SCRIPT));

    ruleText = '@@||$xmlhttprequest,domain=last.fm';
    rule = new adguard.rules.UrlFilterRule(ruleText);

    assert.notOk(rule.isThirdParty());
    assert.ok(rule.getPermittedDomains());
    assert.equal(1, rule.getPermittedDomains().length);
    assert.notOk(rule.shortcut);
    assert.ok(rule.isFiltered('http://example.com', true, adguard.RequestTypes.XMLHTTPREQUEST));

    ruleText = '|$domain=test.com,script';
    rule = new adguard.rules.UrlFilterRule(ruleText);

    assert.notOk(rule.isThirdParty());
    assert.ok(rule.getPermittedDomains());
    assert.equal(1, rule.getPermittedDomains().length);
    assert.notOk(rule.shortcut);
    assert.ok(rule.isFiltered('http://example.com', true, adguard.RequestTypes.SCRIPT));

    ruleText = '||$domain=test.com,script';
    rule = new adguard.rules.UrlFilterRule(ruleText);

    assert.notOk(rule.isThirdParty());
    assert.ok(rule.getPermittedDomains());
    assert.equal(1, rule.getPermittedDomains().length);
    assert.notOk(rule.shortcut);
    assert.ok(rule.isFiltered('http://example.com', true, adguard.RequestTypes.SCRIPT));
});

QUnit.test('Test UrlFilterRule Matching Any Url without permitted domain throws error', (assert) => {
    const ruleText = '*$important';
    assert.throws(() => {
        // eslint-disable-next-line no-unused-vars
        const rule = new adguard.rules.UrlFilterRule(ruleText);
    }, /Too wide basic rule:/, 'throws error');
});

QUnit.test('Important modifier rules', (assert) => {
    let rule = new adguard.rules.UrlFilterRule('||example.com^$important');
    assert.ok(rule.isImportant);

    rule = new adguard.rules.UrlFilterRule('||example.com^$\~important');
    assert.notOk(rule.isImportant);

    rule = new adguard.rules.UrlFilterRule('||example.com^');
    assert.notOk(rule.isImportant);
});

QUnit.test('Important modifier rules priority', (assert) => {
    const importantRule = new adguard.rules.UrlFilterRule('http://$important,domain=test.com');
    const basicRule = new adguard.rules.UrlFilterRule('||example.com^');

    assert.ok(importantRule.isFiltered('http://example.com', true, adguard.RequestTypes.IMAGE));
    assert.ok(importantRule.isPermitted('test.com'));
    assert.ok(basicRule.isFiltered('http://example.com', true, adguard.RequestTypes.IMAGE));
    assert.ok(basicRule.isPermitted('http://example.com'));

    const urlFilter = new adguard.rules.UrlFilter();
    urlFilter.addRule(basicRule);
    urlFilter.addRule(importantRule);

    const result = urlFilter.isFiltered('http://example.com', 'test.com', adguard.RequestTypes.SUBDOCUMENT, true);
    assert.ok(result !== null);
    assert.equal(result.ruleText, importantRule.ruleText);
});

QUnit.test('Rule content types', (assert) => {
    const basicRule = new adguard.rules.UrlFilterRule('@@||example.com^');
    assert.notOk(basicRule.isDocumentWhiteList());
    assert.ok(basicRule.checkContentType(adguard.RequestTypes.DOCUMENT));
    assert.ok(basicRule.checkContentType(adguard.RequestTypes.IMAGE));

    const documentRule = new adguard.rules.UrlFilterRule('@@||example.com^$document');
    assert.ok(documentRule.isDocumentWhiteList());
    assert.ok(documentRule.isElemhide());
    assert.ok(documentRule.checkContentType(adguard.RequestTypes.DOCUMENT));
    assert.notOk(documentRule.checkContentType(adguard.RequestTypes.IMAGE));

    const elemhideRule = new adguard.rules.UrlFilterRule('@@||example.com^$elemhide');
    assert.notOk(elemhideRule.isDocumentWhiteList());
    assert.ok(elemhideRule.isElemhide());
    assert.notOk(elemhideRule.checkContentType(adguard.RequestTypes.IMAGE));

    const whiteListRule = new adguard.rules.UrlFilterRule('@@||example.com^$elemhide,jsinject,urlblock,content');
    assert.ok(whiteListRule.isDocumentWhiteList());
    assert.ok(whiteListRule.isElemhide());
    assert.ok(whiteListRule.isUrlBlock());
    assert.ok(whiteListRule.isJsInject());
    assert.notOk(whiteListRule.isGenericBlock());
    assert.notOk(whiteListRule.isGenericHide());
    assert.notOk(whiteListRule.checkContentType(adguard.RequestTypes.IMAGE));
});

QUnit.test('Regexp rules shortcuts', (assert) => {
    assert.equal(new adguard.rules.UrlFilterRule('/quang%20cao/').shortcut, 'quang%20cao');
    assert.equal(new adguard.rules.UrlFilterRule('/YanAds/').shortcut, 'yanads');
    assert.equal(new adguard.rules.UrlFilterRule('/^http://m\.autohome\.com\.cn\/[a-z0-9]{32}\//$domain=m.autohome.com.cn').shortcut, 'autohome');
    assert.equal(new adguard.rules.UrlFilterRule('/cdsbData_gal/bannerFile/$image,domain=mybogo.net|zipbogo.net	').shortcut, 'cdsbdata_gal/bannerfile');
    assert.equal(new adguard.rules.UrlFilterRule('/http:\/\/rustorka.com\/[a-z]+\.js/$domain=rustorka.com').shortcut, 'http://rustorka');
    assert.equal(new adguard.rules.UrlFilterRule('/^http://www\.iqiyi\.com\/common\/flashplayer\/[0-9]{8}/[0-9a-z]{32}.swf/$domain=iqiyi.com').shortcut, 'com/common/flashplayer');
    assert.equal(new adguard.rules.UrlFilterRule('/ulightbox/$domain=hdkinomax.com|tvfru.net').shortcut, 'ulightbox');
    assert.equal(new adguard.rules.UrlFilterRule('/\.sharesix\.com/.*[a-zA-Z0-9]{4}/$script').shortcut, 'sharesix');
    assert.equal(new adguard.rules.UrlFilterRule('/serial_adv_files/$image,domain=xn--80aacbuczbw9a6a.xn--p1ai|куражбамбей.рф').shortcut, 'serial_adv_files');
    assert.ok(new adguard.rules.UrlFilterRule('/(.jpg)$/').shortcut === null);
    assert.ok(new adguard.rules.UrlFilterRule('@@||*$domain=lenta.ru').shortcut === null);
});

QUnit.test('Many rules in one rule filter', (assert) => {
    const rule = new adguard.rules.UrlFilterRule('$websocket,domain=anime-joy.tv|batmanstream.com|boards2go.com|boreburn.com|celebdirtylaundry.com|celebritymozo.com|cloudtime.to', 1);
    const filter = new adguard.rules.UrlFilter([rule]);
    assert.ok(filter);
    assert.equal(filter.getRules().length, 1);
});

QUnit.test('Escaped ampersand symbol in options', (assert) => {
    adguard.prefs.features.responseContentFilteringSupported = false;

    assert.throws(() => {
        // eslint-disable-next-line no-new
        new adguard.rules.UrlFilterRule('||goodgame.ru/*.php?script=*vastInlineBannerTypeHtml$important,replace=/(<VAST[\s\S]*?>)[\s\S]*<\/VAST>/\\$1<\/VAST>/', 1);
        // assert.ok(false);
    }, new Error('Unknown option: REPLACE'));
});

QUnit.test('RegExp Rules Parsing', (assert) => {
    adguard.prefs.features.responseContentFilteringSupported = false;

    assert.ok(new adguard.rules.UrlFilterRule('/(.jpg)$/').isFiltered('http://test.ru/foo.jpg', false, adguard.RequestTypes.IMAGE));
    assert.notOk(new adguard.rules.UrlFilterRule('/(.jpg)$/').isFiltered('http://test.ru/foo.png', false, adguard.RequestTypes.IMAGE));

    assert.throws(() => {
        // eslint-disable-next-line no-new
        new adguard.rules.UrlFilterRule('/.*/$replace=/hello/bug/');
    }, new Error('Unknown option: REPLACE'));
});

QUnit.test('BadFilter option', (assert) => {
    let badFilterRule = new adguard.rules.UrlFilterRule('https:*_ad_$badfilter');

    assert.ok(badFilterRule);
    assert.ok(badFilterRule.isBadFilter());
    assert.ok(badFilterRule.badFilter);
    assert.equal(badFilterRule.badFilter, 'https:*_ad_');

    badFilterRule = new adguard.rules.UrlFilterRule('https:*_ad_$badfilter,image');

    assert.ok(badFilterRule);
    assert.ok(badFilterRule.isBadFilter());
    assert.ok(badFilterRule.badFilter);
    assert.equal(badFilterRule.badFilter, 'https:*_ad_$image');

    badFilterRule = new adguard.rules.UrlFilterRule('https:*_ad_$third-party,badfilter,image');

    assert.ok(badFilterRule);
    assert.ok(badFilterRule.isBadFilter());
    assert.ok(badFilterRule.badFilter);
    assert.equal(badFilterRule.badFilter, 'https:*_ad_$third-party,image');
});

QUnit.test('Test wildcard domains in the url rules', (assert) => {
    const ruleText = '||test.ru/^$domain=~nigma.*|google.*,third-party,match-case,popup';
    const rule = new adguard.rules.UrlFilterRule(ruleText);

    assert.ok(rule !== null);
    assert.ok(rule.isMatchCase());
    assert.ok(rule.isThirdParty());
    assert.ok(rule.isCheckThirdParty());
    assert.equal('google.*', rule.getPermittedDomains()[0]);
    assert.equal('nigma.*', rule.getRestrictedDomains()[0]);

    assert.ok(rule.isPermitted('google.com'));
    assert.ok(rule.isPermitted('www.google.com'));
    assert.ok(rule.isPermitted('www.google.de'));
    assert.ok(rule.isPermitted('www.google.co.uk'));
    assert.ok(rule.isPermitted('google.co.uk'));

    assert.notOk(rule.isPermitted('google.uk.eu')); // non-existent tld
    assert.notOk(rule.isPermitted('nigma.ru'));
    assert.notOk(rule.isPermitted('nigma.com'));
    assert.notOk(rule.isPermitted('www.nigma.ru'));
    assert.notOk(rule.isPermitted('adguard.ru'));
});

QUnit.test('$document and $popup rule together', (assert) => {
    const ruleText = '||example.org^$document,popup';
    const rule = new adguard.rules.UrlFilterRule(ruleText);
    assert.ok(rule);
    assert.ok(rule.isDocumentLevel());
    assert.ok(rule.isBlockPopups());
});

QUnit.test('Test cookie option', (assert) => {
    let cookieRule = new adguard.rules.UrlFilterRule('||facebook.com^$third-party,cookie=c_user');
    assert.ok(cookieRule);
    assert.ok(cookieRule.isCookieRule());
    assert.ok(cookieRule.cookieOption);
    assert.ok(cookieRule.isThirdParty());
    assert.equal(cookieRule.cookieOption.cookieName, 'c_user');
    assert.notOk(cookieRule.cookieOption.regex);
    assert.ok(cookieRule.cookieOption.matches('c_user'));
    assert.notOk(cookieRule.cookieOption.matches('c_user1'));

    cookieRule = new adguard.rules.UrlFilterRule('$cookie=__cfduid');
    assert.ok(cookieRule);
    assert.ok(cookieRule.isCookieRule());
    assert.ok(cookieRule.cookieOption);
    assert.equal(cookieRule.cookieOption.cookieName, '__cfduid');
    assert.notOk(cookieRule.cookieOption.regex);
    assert.ok(cookieRule.cookieOption.matches('__cfduid'));
    assert.notOk(cookieRule.cookieOption.matches('__cfduid1'));

    cookieRule = new adguard.rules.UrlFilterRule('$cookie=/__utm[a-z]/');
    assert.ok(cookieRule);
    assert.ok(cookieRule.isRegexRule);
    assert.ok(cookieRule.isCookieRule());
    assert.ok(cookieRule.cookieOption);
    assert.equal(cookieRule.cookieOption.regex.toString(), /__utm[a-z]/.toString());
    assert.notOk(cookieRule.cookieOption.cookieName);
    assert.ok(cookieRule.cookieOption.matches('__utma'));
    assert.notOk(cookieRule.cookieOption.matches('__utm0'));

    cookieRule = new adguard.rules.UrlFilterRule('@@||example.org^$cookie');
    assert.ok(cookieRule);
    assert.ok(cookieRule.whiteListRule);
    assert.ok(cookieRule.isCookieRule());
    assert.ok(cookieRule.cookieOption);
    assert.notOk(cookieRule.cookieOption.regex);
    assert.notOk(cookieRule.cookieOption.cookieName);
    assert.ok(cookieRule.cookieOption.matches('123'));
    assert.ok(cookieRule.cookieOption.matches('aaaa'));

    cookieRule = new adguard.rules.UrlFilterRule('$cookie=__cfduid;maxAge=15;sameSite=lax');
    assert.ok(cookieRule);
    assert.ok(cookieRule.isCookieRule());
    assert.ok(cookieRule.cookieOption);
    assert.equal(cookieRule.cookieOption.cookieName, '__cfduid');
    assert.notOk(cookieRule.cookieOption.regex);
    assert.equal(cookieRule.cookieOption.maxAge, 15);
    assert.equal(cookieRule.cookieOption.sameSite, 'lax');
    assert.ok(cookieRule.cookieOption.matches('__cfduid'));
    assert.notOk(cookieRule.cookieOption.matches('123'));
});

QUnit.test('Test stealth option', (assert) => {
    const ruleText = '@@||example.com^$stealth';
    const rule = new adguard.rules.UrlFilterRule(ruleText);

    assert.ok(rule);
    assert.ok(rule.whiteListRule);
    assert.ok(rule.isStealthRule());
});

QUnit.test('Test replace option', (assert) => {
    adguard.prefs.features.responseContentFilteringSupported = true;

    const replaceRule = new adguard.rules.UrlFilterRule('||example.org^$replace=/test/test2/i');
    assert.ok(replaceRule);
    assert.ok(replaceRule.isReplaceRule());
});


QUnit.test('Invalid $domain options throw exception', (assert) => {
    try {
        const rule = new adguard.rules.UrlFilterRule('|http*$domain=|');
        assert.notOk(rule);
    } catch (ex) {
        assert.ok(ex === 'Error load $domain options from "|", because after split one of them is empty');
    }

    try {
        const rule = new adguard.rules.UrlFilterRule('|http*$script,domain=|example.org');
        assert.notOk(rule);
    } catch (ex) {
        assert.ok(ex === 'Error load $domain options from "|example.org", because after split one of them is empty');
    }

    try {
        const rule = new adguard.rules.UrlFilterRule('|http*$domain=|example.org');
        assert.notOk(rule);
    } catch (ex) {
        assert.ok(ex === 'Error load $domain options from "|example.org", because after split one of them is empty');
    }


    const rule = new adguard.rules.UrlFilterRule('|http*$domain=example.org');
    assert.ok(rule);
    assert.equal(rule.permittedDomain, 'example.org');
});

QUnit.test('Non-basic $first-party modifier', (assert) => {
    const { RequestTypes } = adguard;

    const ruleText = '||example.org$first-party';
    const rule = new adguard.rules.UrlFilterRule(ruleText);

    // Check rule properties
    assert.notOk(rule.isThirdParty());

    // Check rule work
    assert.ok(rule.isFiltered('https://example.org/icon.ico', false, RequestTypes.IMAGE));
    assert.notOk(rule.isFiltered('https://test.ru/script.js', true, RequestTypes.SCRIPT));
});

QUnit.test('Non-basic "$xhr" modifier', (assert) => {
    const { RequestTypes } = adguard;

    const ruleText = '||example.org$xhr';
    const rule = new adguard.rules.UrlFilterRule(ruleText);
    assert.ok(rule.isFiltered('http://example.org/?ololo=ololo', false, RequestTypes.XMLHTTPREQUEST));
});

QUnit.test('Non-basic "$popunder" modifier', (assert) => {
    const { RequestTypes } = adguard;
    const ruleText = '||example.org$popunder';
    const rule = new adguard.rules.UrlFilterRule(ruleText);
    assert.ok(rule.isBlockPopups());
    assert.ok(rule.isDocumentLevel());
    assert.ok(rule.isFiltered('http://example.org/?ololo=ololo', false, RequestTypes.DOCUMENT));
});

QUnit.test('Non-basic "$1p" modifier', (assert) => {
    const { RequestTypes } = adguard;

    const ruleText = '||example.org$1p';
    const rule = new adguard.rules.UrlFilterRule(ruleText);

    // Check rule properties
    assert.notOk(rule.isThirdParty());

    // Check rule work
    assert.ok(rule.isFiltered('https://example.org/icon.ico', false, RequestTypes.IMAGE));
    assert.notOk(rule.isFiltered('https://test.ru/script.js', true, RequestTypes.SCRIPT));
});

QUnit.test('Non-basic "$3p" modifier', (assert) => {
    const { RequestTypes } = adguard;

    const ruleText = '||test.ru/$domain=google.com,3p';
    const rule = new adguard.rules.UrlFilterRule(ruleText);

    // Check rule properties
    assert.ok(rule.isThirdParty());

    // Check rule work
    assert.ok(rule.isFiltered('http://test.ru/', true, RequestTypes.DOCUMENT));
    assert.ok(rule.isFiltered('http://test.ru/index.js', true, RequestTypes.SCRIPT));
    assert.ok(rule.isPermitted('google.com'));
});

QUnit.test('Non-basic "$css" modifier', (assert) => {
    const { RequestTypes } = adguard;

    const rule = new adguard.rules.UrlFilterRule('||example.org^$css');
    assert.ok(rule.checkContentType(RequestTypes.STYLESHEET));
    assert.ok(rule.isFiltered('https://example.org/styles.css', false, RequestTypes.STYLESHEET));
});

QUnit.test('Non-basic "$frame" modifier', (assert) => {
    const { RequestTypes } = adguard;

    const rule = new adguard.rules.UrlFilterRule('||example.org^$frame');
    assert.ok(rule.checkContentType(RequestTypes.SUBDOCUMENT));
    assert.notOk(rule.checkContentType(RequestTypes.DOCUMENT));
    assert.ok(rule.isFiltered('https://example.org/foo', false, RequestTypes.SUBDOCUMENT));
});

QUnit.test('$document modifier', (assert) => {
    const { RequestTypes } = adguard;

    const rule = new adguard.rules.UrlFilterRule('||example.org^$document');
    assert.ok(rule.checkContentType(RequestTypes.DOCUMENT));
    assert.ok(rule.isFiltered('https://example.org/foo', false, RequestTypes.DOCUMENT));
    assert.ok(rule.isFiltered('https://example.org', false, RequestTypes.DOCUMENT));
    assert.notOk(rule.isFiltered('https://example.org', false, RequestTypes.SCRIPT));
});
