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
