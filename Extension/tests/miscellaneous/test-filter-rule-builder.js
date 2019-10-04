QUnit.test('Build Rules', (assert) => {
    const scriptFilter = new adguard.rules.ScriptFilter();

    const ruleText = 'www.example.org#%#//scriptlet("set-constant", "test", "true")';
    const rule = new adguard.rules.ScriptletRule(ruleText);
    scriptFilter.addRule(rule);

    assert.equal(scriptFilter.getRules().length, 1, 'Rule has been added');

    const whiteRuleText = 'example.org#@%#//scriptlet("set-constant", "test", "true")';
    const whiteRule = new adguard.rules.ScriptletRule(whiteRuleText);
    scriptFilter.addRule(whiteRule);

    assert.equal(scriptFilter.getRules().length, 2, 'Whitelist rule has been added');

    assert.notOk(rule.isPermitted('example.org'));
    assert.notOk(rule.isPermitted('www.example.org'));
});

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

    rule = adguard.rules.builder.createRule('example.org#%#window.__gaq = undefined;', 0);
    assert.ok(rule);
    assert.ok(rule instanceof adguard.rules.ScriptFilterRule);

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


QUnit.test('Invalid Style Syntax', (assert) => {
    const ruleText = 'yandex.ru##body:style()';
    assert.throws(() => {
        adguard.rules.ruleConverter.convertRule(ruleText);
    }, new Error('Empty :style pseudo class: body:style()'));
});
