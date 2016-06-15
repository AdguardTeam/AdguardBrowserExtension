/* global addTestCase */
/* global assertFalse */
/* global assertEquals */
/* global assertTrue */

function testConstructor() {
    var element = document.getElementById('test-div');

    var options = {
        isBlockByUrl: false,
        urlMask: 'test.com/page',
        isBlockSimilar : false,
        isBlockOneDomain: false,
        url: 'http://example.org/test-page.html?param=p1',
        attributes: ''
    };

    var ruleText = AdguardRulesConstructorLib.constructRuleText(element, options);
    assertEquals(ruleText, 'example.org###test-div');

    options.isBlockByUrl = true;
    ruleText = AdguardRulesConstructorLib.constructRuleText(element, options);
    assertEquals(ruleText, 'test.com/page$domain=example.org');

    options.isBlockByUrl = false;
    options.isBlockSimilar = true;
    options.isBlockOneDomain = false;
    ruleText = AdguardRulesConstructorLib.constructRuleText(element, options);
    assertEquals(ruleText, 'example.org##.test-class');

    options.isBlockByUrl = false;
    options.isBlockSimilar = true;
    options.isBlockOneDomain = true;
    ruleText = AdguardRulesConstructorLib.constructRuleText(element, options);
    assertEquals(ruleText, '##.test-class');

    options.isBlockByUrl = false;
    options.isBlockSimilar = false;
    options.isBlockOneDomain = true;
    ruleText = AdguardRulesConstructorLib.constructRuleText(element, options);
    assertEquals(ruleText, '###test-div');

    options.isBlockByUrl = false;
    options.isBlockSimilar = false;
    options.isBlockOneDomain = true;
    options.attributes = '[title="Share on Twitter"][attribute="aValue"]';
    ruleText = AdguardRulesConstructorLib.constructRuleText(element, options);
    assertEquals(ruleText, '###test-div[title="Share on Twitter"][attribute="aValue"]');
}
addTestCase(testConstructor);