QUnit.test('Build Rules', (assert) => {
    let rule = adguard.rules.builder.createRule('example.com', 0);
    assert.ok(rule);
    assert.ok(rule instanceof adguard.rules.UrlFilterRule);

    rule = adguard.rules.builder.createRule('example.com$important', 0);
    assert.ok(rule);
    assert.ok(rule instanceof adguard.rules.UrlFilterRule);

    adguard.prefs.features.responseContentFilteringSupported = true;

    rule = adguard.rules.builder.createRule('example.org$$script[data-src="banner"]', 0);
    assert.ok(rule);
    assert.ok(rule instanceof adguard.rules.ContentFilterRule);

    rule = adguard.rules.builder.createRule('example.org#%#window.__gaq = undefined;', 0, false);
    assert.notOk(rule);

    rule = adguard.rules.builder.createRule('||example.org^$replace=/example/trusted/gi', 0, false);
    assert.notOk(rule);

    rule = adguard.rules.builder.createRule('||example.org^$replace=/example/trusted/gi', 0);
    assert.ok(rule);
});

QUnit.test('Unsupported rules', (assert) => {
    const rule = adguard.rules.builder.createRule('#$#body { background: black }', 0);
    assert.ok(rule);
    assert.ok(rule instanceof adguard.rules.CssFilterRule);
});

// https://github.com/AdguardTeam/AdguardBrowserExtension/issues/1600
QUnit.test('Too short rules are ignored', (assert) => {
    let ruleText = 'adg';
    let rule = adguard.rules.builder.createRule(ruleText, 0);
    assert.notOk(rule);

    ruleText = '||example.org^$image';
    rule = adguard.rules.builder.createRule(ruleText, 0);
    assert.ok(rule);
    assert.equal(rule.ruleText, ruleText);
});
