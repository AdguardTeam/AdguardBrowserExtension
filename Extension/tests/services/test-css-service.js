/* eslint-disable max-len */
/* global QUnit, TSUrlFilter */

QUnit.test('General', (assert) => {
    const elemhideRuleText = 'example.org##body';
    const injectRuleText = 'example.org#$#.textad { visibility: hidden; }';

    const elemhideRule = new TSUrlFilter.CosmeticRule(elemhideRuleText, 1);
    const injectRule = new TSUrlFilter.CosmeticRule(injectRuleText, 1);

    let stylesheet = adguard.cssService.buildStyleSheet([elemhideRule], [injectRule]);
    assert.ok(stylesheet);
    assert.equal(stylesheet.length, 2);
    assert.equal(stylesheet[0], 'body { display: none!important; }\r\n');
    assert.equal(stylesheet[1], '.textad { visibility: hidden; }');

    stylesheet = adguard.cssService.buildStyleSheet([elemhideRule], [injectRule], true);
    assert.ok(stylesheet);
    assert.equal(stylesheet.length, 2);
    assert.equal(stylesheet[0], 'body { display: none!important; }\r\n');
    assert.equal(stylesheet[1], '.textad { visibility: hidden; }');
});

QUnit.test('Css hits', (assert) => {
    const elemhideRuleText = 'example.org##body';
    const injectRuleText = 'example.org#$#.textad { visibility: hidden; }';

    const elemhideRule = new TSUrlFilter.CosmeticRule(elemhideRuleText, 1);
    const injectRule = new TSUrlFilter.CosmeticRule(injectRuleText, 1);

    let stylesheet = adguard.cssService.buildStyleSheetHits([elemhideRule], [injectRule]);
    assert.ok(stylesheet);
    assert.equal(stylesheet.length, 2);
    assert.equal(stylesheet[0], 'body { display: none!important; content: \'adguard1%3Bexample.org%23%23body\' !important;}\r\n');
    assert.equal(stylesheet[1], '.textad { visibility: hidden; content: \'adguard1%3Bexample.org%23%24%23.textad%20%7B%20visibility%3A%20hidden%3B%20%7D\' !important;}\r\n');

    stylesheet = adguard.cssService.buildStyleSheetHits([elemhideRule], [injectRule]);
    assert.ok(stylesheet);
    assert.equal(stylesheet.length, 2);
    assert.equal(stylesheet[0], 'body { display: none!important; content: \'adguard1%3Bexample.org%23%23body\' !important;}\r\n');
    assert.equal(stylesheet[1], '.textad { visibility: hidden; content: \'adguard1%3Bexample.org%23%24%23.textad%20%7B%20visibility%3A%20hidden%3B%20%7D\' !important;}\r\n');
});
