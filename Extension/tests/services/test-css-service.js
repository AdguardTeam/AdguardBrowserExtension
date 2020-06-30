/* eslint-disable max-len */
/* global QUnit, CosmeticRule */

QUnit.test('General', (assert) => {
    const elemihideRuleText = 'example.org##body';
    const injectRuleText = 'example.org#$#.textad { visibility: hidden; }';

    const elemhideRule = new CosmeticRule(elemihideRuleText, 1);
    const injectRule = new CosmeticRule(injectRuleText, 1);

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
    const elemihideRuleText = 'example.org##body';
    const injectRuleText = 'example.org#$#.textad { visibility: hidden; }';

    const elemhideRule = new CosmeticRule(elemihideRuleText, 1);
    const injectRule = new CosmeticRule(injectRuleText, 1);

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

// TODO: Tests
//
// QUnit.test('Css Exception Rules', (assert) => {
//     const rule = new adguard.rules.CssFilterRule('##.sponsored');
//     const rule1 = new adguard.rules.CssFilterRule('adguard.com#@#.sponsored');
//     const filter = new adguard.rules.CssFilter([rule]);
//
//     let { css } = filter.buildCss('adguard.com');
//     let commonCss = filter.buildCss(null).css;
//     assert.equal(css[0], commonCss[0]);
//
//     filter.addRule(rule1);
//     css = filter.buildCss('adguard.com').css;
//     commonCss = filter.buildCss(null).css;
//     assert.equal(css.length, 0);
//     assert.equal(css.length, commonCss.length);
//
//     css = filter.buildCss('another.domain').css;
//     assert.ok(css.length > 0);
//
//     filter.removeRule(rule1);
//     css = filter.buildCss('adguard.com').css;
//     commonCss = filter.buildCss(null).css;
//     assert.ok(css.length > 0);
//     assert.equal(css[0], commonCss[0]);
// });
//
// QUnit.test('Css GenericHide Exception Rules', (assert) => {
//     const genericOne = new adguard.rules.CssFilterRule('##.generic-one');
//     const genericTwo = new adguard.rules.CssFilterRule('~google.com,~yahoo.com###generic');
//     const nonGeneric = new adguard.rules.CssFilterRule('adguard.com##.non-generic');
//     const injectRule = new adguard.rules.CssFilterRule('adguard.com#$#body { background-color: #111!important; }');
//     const exceptionRule = new adguard.rules.CssFilterRule('adguard.com#@#.generic-one');
//     const genericHideRule = new adguard.rules.UrlFilterRule('@@||adguard.com^$generichide');
//     const elemHideRule = new adguard.rules.UrlFilterRule('@@||adguard.com^$elemhide');
//     const filter = new adguard.rules.CssFilter([genericOne]);
//
//     let { css } = filter.buildCss('adguard.com');
//     let commonCss = filter.buildCss(null).css;
//     assert.equal(css[0], commonCss[0]);
//
//     filter.addRule(genericTwo);
//     css = filter.buildCss('adguard.com').css;
//     commonCss = filter.buildCss(null).css;
//     assert.equal(css.length, 2);
//     assert.equal(commonCss.length, 1);
//     assert.equal(css[0], commonCss[0]);
//
//     filter.addRule(nonGeneric);
//     css = filter.buildCss('adguard.com').css;
//     commonCss = filter.buildCss(null).css;
//     assert.equal(css.length, 2);
//     assert.equal(css[0], commonCss[0]);
//
//     let otherCss = filter.buildCss('another.domain').css;
//     assert.equal(otherCss.length, 2);
//
//     filter.addRule(exceptionRule);
//     css = filter.buildCss('adguard.com').css;
//     commonCss = filter.buildCss(null).css;
//     otherCss = filter.buildCss('another.domain').css;
//     assert.equal(css.length, 1);
//     assert.equal(commonCss.length, 0);
//     assert.equal(otherCss.length, 1);
//
//     filter.addRule(genericHideRule);
//     css = filter.buildCss('adguard.com', genericHide).css;
//     commonCss = filter.buildCss(null).css;
//     otherCss = filter.buildCss('another.domain').css;
//     assert.equal(css.length, 1);
//     assert.ok(css[0].indexOf('#generic') < 0);
//     assert.equal(commonCss.length, 0);
//     assert.equal(otherCss.length, 1);
//
//     filter.removeRule(exceptionRule);
//     css = filter.buildCss('adguard.com', genericHide).css;
//     commonCss = filter.buildCss(null).css;
//     otherCss = filter.buildCss('another.domain').css;
//     assert.equal(css.length, 1);
//     assert.equal(commonCss.length, 1);
//     assert.equal(otherCss.length, 2);
//
//     filter.addRule(elemHideRule);
//     css = filter.buildCss('adguard.com', genericHide).css;
//     commonCss = filter.buildCss(null).css;
//     otherCss = filter.buildCss('another.domain').css;
//     assert.equal(css.length, 1);
//     assert.equal(commonCss.length, 1);
//     assert.equal(otherCss.length, 2);
//
//     filter.addRule(injectRule);
//     css = filter.buildCss('adguard.com', genericHide).css;
//     commonCss = filter.buildCss(null).css;
//     otherCss = filter.buildCss('another.domain').css;
//     assert.equal(css.length, 2);
//     assert.equal(commonCss.length, 1);
//     assert.equal(otherCss.length, 2);
// });
//
// QUnit.test('Extended Css Build', (assert) => {
//     const rule = new adguard.rules.CssFilterRule('adguard.com##.sponsored');
//     const genericRule = new adguard.rules.CssFilterRule('##.banner');
//     const extendedCssRule = new adguard.rules.CssFilterRule('adguard.com##.sponsored[-ext-contains=test]');
//     const filter = new adguard.rules.CssFilter([rule, genericRule, extendedCssRule]);
//
//     let selectors; let css; let extendedCss; let
//         commonCss;
//
//     selectors = filter.buildCss('adguard.com');
//     css = selectors.css;
//     extendedCss = selectors.extendedCss;
//     commonCss = filter.buildCss(null).css;
//     assert.equal(commonCss.length, 1);
//     assert.equal(css.length, 2);
//     assert.equal(extendedCss.length, 1);
//
//     selectors = filter.buildCss('adguard.com', genericHide);
//     css = selectors.css;
//     extendedCss = selectors.extendedCss;
//     commonCss = filter.buildCss(null).css;
//     assert.equal(commonCss.length, 1);
//     assert.equal(css.length, 1);
//     assert.equal(extendedCss.length, 1);
// });
//
// QUnit.test('Extended Css Build Common Extended', (assert) => {
//     const rule = new adguard.rules.CssFilterRule('adguard.com##.sponsored');
//     const genericRule = new adguard.rules.CssFilterRule('##.banner');
//     const extendedCssRule = new adguard.rules.CssFilterRule('##.sponsored[-ext-contains=test]');
//     const filter = new adguard.rules.CssFilter([rule, genericRule, extendedCssRule]);
//
//     let selectors; let css; let extendedCss; let
//         commonCss;
//
//     selectors = filter.buildCss('adguard.com');
//     css = selectors.css;
//     extendedCss = selectors.extendedCss;
//     commonCss = filter.buildCss(null).css;
//     assert.equal(commonCss.length, 1);
//     assert.equal(css.length, 2);
//     assert.equal(extendedCss.length, 1);
//
//     selectors = filter.buildCss('adguard.com', genericHide);
//     css = selectors.css;
//     extendedCss = selectors.extendedCss;
//     commonCss = filter.buildCss(null).css;
//     assert.equal(commonCss.length, 1);
//     assert.equal(css.length, 1);
//     assert.equal(extendedCss.length, 0);
// });
//
// QUnit.test('Extended Css Build CssHits', (assert) => {
//     const rule = new adguard.rules.CssFilterRule('adguard.com##.sponsored', 1);
//     const genericRule = new adguard.rules.CssFilterRule('##.banner', 2);
//     const extendedCssRule = new adguard.rules.CssFilterRule('adguard.com##.sponsored[-ext-contains=test]', 1);
//     const filter = new adguard.rules.CssFilter([rule, genericRule, extendedCssRule]);
//
//     let selectors; let css; let extendedCss; let
//         commonCss;
//
//     selectors = filter.buildCssHits('adguard.com');
//     css = selectors.css;
//     extendedCss = selectors.extendedCss;
//     commonCss = filter.buildCssHits(null).css;
//     assert.equal(commonCss.length, 1);
//     assert.equal(commonCss[0].trim(), ".banner { display: none!important; content: 'adguard2%3B%23%23.banner' !important;}");
//     assert.equal(css.length, 2);
//     assert.equal(css[0].trim(), ".banner { display: none!important; content: 'adguard2%3B%23%23.banner' !important;}");
//     assert.equal(css[1].trim(), ".sponsored { display: none!important; content: 'adguard1%3Badguard.com%23%23.sponsored' !important;}");
//     assert.equal(extendedCss.length, 1);
//     assert.equal(extendedCss[0].trim(), ".sponsored[-ext-contains=test] { display: none!important; content: 'adguard1%3Badguard.com%23%23.sponsored%5B-ext-contains%3Dtest%5D' !important;}");
//
//     selectors = filter.buildCssHits('adguard.com', genericHide);
//     css = selectors.css;
//     extendedCss = selectors.extendedCss;
//     commonCss = filter.buildCssHits(null).css;
//     assert.equal(commonCss.length, 1);
//     assert.equal(commonCss[0].trim(), ".banner { display: none!important; content: 'adguard2%3B%23%23.banner' !important;}");
//     assert.equal(css.length, 1);
//     assert.equal(css[0].trim(), ".sponsored { display: none!important; content: 'adguard1%3Badguard.com%23%23.sponsored' !important;}");
//     assert.equal(extendedCss.length, 1);
//     assert.equal(extendedCss[0].trim(), ".sponsored[-ext-contains=test] { display: none!important; content: 'adguard1%3Badguard.com%23%23.sponsored%5B-ext-contains%3Dtest%5D' !important;}");
// });
