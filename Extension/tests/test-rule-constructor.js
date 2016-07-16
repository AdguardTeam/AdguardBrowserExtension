/* global addTestCase */
/* global assertFalse */
/* global assertEquals */
/* global assertTrue */

function testConstructorAssistant() {

    var element = document.getElementById('test-div');
    var elementHref = document.getElementsByClassName('a-test-class')[0];

    var options = {
        isBlockByUrl: false,
        urlMask: 'test.com/page',
        isBlockSimilar : false,
        isBlockOneDomain: false,
        url: 'http://example.org/test-page.html?param=p1',
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
    assertEquals(ruleText, 'example.org##.test-class.test-class-two');

    options.isBlockByUrl = false;
    options.isBlockSimilar = false;
    options.isBlockOneDomain = true;
    ruleText = AdguardRulesConstructorLib.constructRuleText(element, options);
    assertEquals(ruleText, '###test-div');

    options.isBlockByUrl = false;
    options.isBlockSimilar = false;
    options.isBlockOneDomain = true;
    ruleText = AdguardRulesConstructorLib.constructRuleText(elementHref, options);
    assertEquals(ruleText, '###test-div > a.a-test-class.a-test-class-two.a-test-class-three:first-child');
}
addTestCase(testConstructorAssistant);

function testConstructorDevTools() {
    var element = document.getElementById('test-div');
    var elementHref = document.getElementsByClassName('a-test-class')[0];

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

    options.isBlockSimilar = true;
    options.classesSelector = '';
    ruleText = AdguardRulesConstructorLib.constructRuleText(element, options);
    assertEquals(ruleText, 'example.org');

    options.classesSelector = null;
    options.excludeTagName = false;
    ruleText = AdguardRulesConstructorLib.constructRuleText(element, options);
    assertEquals(ruleText, 'example.org##div.test-class.test-class-two');

    options.isBlockByUrl = false;
    options.isBlockSimilar = true;
    options.isBlockOneDomain = true;
    options.excludeTagName = true;
    ruleText = AdguardRulesConstructorLib.constructRuleText(element, options);
    assertEquals(ruleText, '##.test-class.test-class-two');

    options.classesSelector = '.test-class-two';
    ruleText = AdguardRulesConstructorLib.constructRuleText(element, options);
    assertEquals(ruleText, '##.test-class-two');
    options.classesSelector = null;

    options.isBlockByUrl = false;
    options.isBlockSimilar = false;
    options.isBlockOneDomain = true;
    options.attributes = '[title="Share on Twitter"][attribute="aValue"]';
    ruleText = AdguardRulesConstructorLib.constructRuleText(element, options);
    assertEquals(ruleText, '###test-div[title="Share on Twitter"][attribute="aValue"]');

    options.isBlockByUrl = false;
    options.isBlockSimilar = false;
    options.isBlockOneDomain = true;
    options.attributes = '';
    options.excludeTagName = false;
    ruleText = AdguardRulesConstructorLib.constructRuleText(elementHref, options);
    assertEquals(ruleText, '###test-div > a.a-test-class.a-test-class-two.a-test-class-three:first-child');

    options.excludeTagName = true;
    ruleText = AdguardRulesConstructorLib.constructRuleText(elementHref, options);
    assertEquals(ruleText, '###test-div > .a-test-class.a-test-class-two.a-test-class-three:first-child');

    options.classesSelector = '.a-test-class-two.a-test-class-three';
    ruleText = AdguardRulesConstructorLib.constructRuleText(elementHref, options);
    assertEquals(ruleText, '###test-div > .a-test-class-two.a-test-class-three:first-child');
}
addTestCase(testConstructorDevTools);

function testConstructorSpecialElements() {

    var elementHref = document.getElementsByTagName('h2')[0];
    var options = {
        isBlockByUrl: false,
        urlMask: null,
        isBlockSimilar: false,
        isBlockOneDomain: false,
        url: 'https://lenta.ru/',
        attributes: '',
        excludeTagName: false,
        classesSelector: ''
    };

    var ruleText = AdguardRulesConstructorLib.constructRuleText(elementHref, options);
    assertEquals(ruleText, 'lenta.ru###test-div > h2:last-child');

    var elementDivId = document.getElementById('test-id-div');
    options = {
        isBlockByUrl: false,
        urlMask: null,
        isBlockSimilar: false,
        isBlockOneDomain: false,
        url: 'https://lenta.ru/',
        attributes: '',
        excludeTagName: true,
        classesSelector: ''
    };

    ruleText = AdguardRulesConstructorLib.constructRuleText(elementDivId, options);
    assertEquals(ruleText, 'lenta.ru###test-id-div');

    options.excludeTagName = false;
    ruleText = AdguardRulesConstructorLib.constructRuleText(elementDivId, options);
    assertEquals(ruleText, 'lenta.ru##div#test-id-div');

    options.attributes = '[title="Share on Twitter"]';
    ruleText = AdguardRulesConstructorLib.constructRuleText(elementDivId, options);
    assertEquals(ruleText, 'lenta.ru##div#test-id-div[title="Share on Twitter"]');

    options.attributes = '[id="test-id-div"][title="Share on Twitter"]';
    ruleText = AdguardRulesConstructorLib.constructRuleText(elementDivId, options);
    assertEquals(ruleText, 'lenta.ru##div#test-id-div[id="test-id-div"][title="Share on Twitter"]');

    options.attributes = '[id="test-id-div"]';
    ruleText = AdguardRulesConstructorLib.constructRuleText(elementDivId, options);
    assertEquals(ruleText, 'lenta.ru##div#test-id-div[id="test-id-div"]');

    options.classesSelector = '.test-class-two';
    delete options.attributes;
    ruleText = AdguardRulesConstructorLib.constructRuleText(elementDivId, options);
    assertEquals(ruleText, 'lenta.ru##div.test-class-two#test-id-div');
}
addTestCase(testConstructorSpecialElements);

function testConstructRuleStyle() {
    var selector;
    selector = AdguardRulesConstructorLib.constructRuleCssSelector('lenta.ru##div.test-class-two#test-id-div');
    assertEquals('div.test-class-two#test-id-div', selector);

    selector = AdguardRulesConstructorLib.constructRuleCssSelector('lenta.ru###test-div > h2:last-child');
    assertEquals('#test-div > h2:last-child', selector);

    selector = AdguardRulesConstructorLib.constructRuleCssSelector('##div#test-id-div[id="test-id-div"][title="Share on Twitter"]');
    assertEquals('div#test-id-div[id="test-id-div"][title="Share on Twitter"]', selector);

    selector = AdguardRulesConstructorLib.constructRuleCssSelector('lenta.ru');
    assertEquals('body', selector);

    selector = AdguardRulesConstructorLib.constructRuleCssSelector('test.com/page$domain=example.org');
    assertEquals('[src="test.com/page$domain=example.org"]', selector);
}
addTestCase(testConstructRuleStyle);