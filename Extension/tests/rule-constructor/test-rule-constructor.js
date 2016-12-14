QUnit.test("Rules Constructor for Assistant", function(assert) {
    var element = document.getElementById('test-div');
    var elementHref = document.getElementsByClassName('a-test-class')[0];

    var options = {
        isBlockByUrl: false,
        urlMask: 'test.com/page',
        isBlockSimilar : false,
        isBlockOneDomain: false,
        url: 'http://example.org/test-page.html?param=p1'
    };

    var ruleText = AdguardRulesConstructorLib.constructRuleText(element, options);
    assert.equal(ruleText, 'example.org###test-div');

    options.isBlockByUrl = true;
    ruleText = AdguardRulesConstructorLib.constructRuleText(element, options);
    assert.equal(ruleText, 'test.com/page$domain=example.org');

    options.isBlockByUrl = false;
    options.isBlockSimilar = true;
    options.isBlockOneDomain = false;
    ruleText = AdguardRulesConstructorLib.constructRuleText(element, options);
    assert.equal(ruleText, 'example.org##.test-class.test-class-two');

    options.isBlockByUrl = false;
    options.isBlockSimilar = false;
    options.isBlockOneDomain = true;
    ruleText = AdguardRulesConstructorLib.constructRuleText(element, options);
    assert.equal(ruleText, '###test-div');

    options.isBlockByUrl = false;
    options.isBlockSimilar = false;
    options.isBlockOneDomain = true;
    ruleText = AdguardRulesConstructorLib.constructRuleText(elementHref, options);
    assert.equal(ruleText, '###test-div > a.a-test-class.a-test-class-two.a-test-class-three:first-child');
});

QUnit.test("Rules Constructor for DevTools", function(assert) {
    var element = document.getElementById('test-div');
    var elementHref = document.getElementsByClassName('a-test-class')[0];

    var options = {
        isBlockByUrl: false,
        urlMask: 'test.com/page',
        isBlockSimilar : false,
        isBlockOneDomain: false,
        url: 'http://example.org/test-page.html?param=p1',
        attributes: '',
        excludeId: false
    };

    var ruleText = AdguardRulesConstructorLib.constructRuleText(element, options);
    assert.equal(ruleText, 'example.org###test-div');

    options.isBlockSimilar = true;
    options.classesSelector = '';
    ruleText = AdguardRulesConstructorLib.constructRuleText(element, options);
    assert.equal(ruleText, 'example.org');

    options.classesSelector = null;
    options.excludeTagName = false;
    ruleText = AdguardRulesConstructorLib.constructRuleText(element, options);
    assert.equal(ruleText, 'example.org##div.test-class.test-class-two');

    options.isBlockByUrl = false;
    options.isBlockSimilar = true;
    options.isBlockOneDomain = true;
    options.excludeTagName = true;
    ruleText = AdguardRulesConstructorLib.constructRuleText(element, options);
    assert.equal(ruleText, '##.test-class.test-class-two');

    options.classesSelector = '.test-class-two';
    ruleText = AdguardRulesConstructorLib.constructRuleText(element, options);
    assert.equal(ruleText, '##.test-class-two');
    options.classesSelector = null;

    options.isBlockByUrl = false;
    options.isBlockSimilar = false;
    options.isBlockOneDomain = true;
    options.attributes = '[title="Share on Twitter"][attribute="aValue"]';
    ruleText = AdguardRulesConstructorLib.constructRuleText(element, options);
    assert.equal(ruleText, '###test-div[title="Share on Twitter"][attribute="aValue"]');

    options.isBlockByUrl = false;
    options.isBlockSimilar = false;
    options.isBlockOneDomain = true;
    options.attributes = '';
    options.excludeTagName = false;
    ruleText = AdguardRulesConstructorLib.constructRuleText(elementHref, options);
    assert.equal(ruleText, '###test-div > a.a-test-class.a-test-class-two.a-test-class-three:first-child');

    options.excludeTagName = true;
    ruleText = AdguardRulesConstructorLib.constructRuleText(elementHref, options);
    assert.equal(ruleText, '###test-div > .a-test-class.a-test-class-two.a-test-class-three:first-child');

    options.classesSelector = '.a-test-class-two.a-test-class-three';
    ruleText = AdguardRulesConstructorLib.constructRuleText(elementHref, options);
    assert.equal(ruleText, '###test-div > .a-test-class-two.a-test-class-three:first-child');
});

QUnit.test("Rules Constructor DevTools Id Elements Special Cases", function(assert) {
    var element = document.getElementById('test-div');
    var elementHref = document.getElementsByClassName('a-test-class')[0];

    var options = {
        isBlockByUrl: false,
        urlMask: 'test.com/page',
        isBlockSimilar: false,
        isBlockOneDomain: false,
        url: 'http://example.org/test-page.html?param=p1',
        attributes: '',
        excludeId: false
    };

    var ruleText = AdguardRulesConstructorLib.constructRuleText(element, options);
    assert.equal(ruleText, 'example.org###test-div');

    //Id attribute is checked
    options.attributes = '[title="Share on Twitter"]';
    options.excludeId = false;
    ruleText = AdguardRulesConstructorLib.constructRuleText(element, options);
    assert.equal(ruleText, 'example.org###test-div[title="Share on Twitter"]');

    //Element has id but it's not checked
    options.attributes = '[title="Share on Twitter"]';
    options.excludeId = true;
    ruleText = AdguardRulesConstructorLib.constructRuleText(element, options);
    assert.equal(ruleText, 'example.org##[title="Share on Twitter"]');

    //Element doesn't have id - option should not have any effect
    options.excludeId = false;
    ruleText = AdguardRulesConstructorLib.constructRuleText(elementHref, options);
    assert.equal(ruleText, 'example.org###test-div > a.a-test-class.a-test-class-two.a-test-class-three:first-child[title=\"Share on Twitter\"]');

    options.excludeId = true;
    ruleText = AdguardRulesConstructorLib.constructRuleText(elementHref, options);
    assert.equal(ruleText, 'example.org###test-div > a.a-test-class.a-test-class-two.a-test-class-three:first-child[title=\"Share on Twitter\"]');
});

QUnit.test("Rules Constructor for special elements", function(assert) {
    var elementHref = document.querySelector("#test-div h2"); 
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
    assert.equal(ruleText, 'lenta.ru###test-div > h2:last-child');

    var elementDivId = document.getElementById('test-id-div');
    options = {
        isBlockByUrl: false,
        urlMask: null,
        isBlockSimilar: false,
        isBlockOneDomain: false,
        url: 'https://lenta.ru/',
        attributes: '',
        excludeTagName: true,
        classesSelector: '',
        excludeId: false
    };

    ruleText = AdguardRulesConstructorLib.constructRuleText(elementDivId, options);
    assert.equal(ruleText, 'lenta.ru###test-id-div');

    options.excludeTagName = false;
    ruleText = AdguardRulesConstructorLib.constructRuleText(elementDivId, options);
    assert.equal(ruleText, 'lenta.ru##div#test-id-div');

    options.attributes = '[title="Share on Twitter"]';
    ruleText = AdguardRulesConstructorLib.constructRuleText(elementDivId, options);
    assert.equal(ruleText, 'lenta.ru##div#test-id-div[title="Share on Twitter"]');

    options.attributes = '[someAttr="some-attr-value"][title="Share on Twitter"]';
    ruleText = AdguardRulesConstructorLib.constructRuleText(elementDivId, options);
    assert.equal(ruleText, 'lenta.ru##div#test-id-div[someAttr="some-attr-value"][title="Share on Twitter"]');

    options.classesSelector = '.test-class-two';
    delete options.attributes;
    ruleText = AdguardRulesConstructorLib.constructRuleText(elementDivId, options);
    assert.equal(ruleText, 'lenta.ru##div.test-class-two#test-id-div');
});

QUnit.test("Rules Constructor for CSS selector", function(assert) {
    var selector;
    selector = AdguardRulesConstructorLib.constructRuleCssSelector('lenta.ru##div.test-class-two#test-id-div$domain=example.org');
    assert.equal('div.test-class-two#test-id-div', selector);

    selector = AdguardRulesConstructorLib.constructRuleCssSelector('lenta.ru###test-div > h2:last-child');
    assert.equal('#test-div > h2:last-child', selector);

    selector = AdguardRulesConstructorLib.constructRuleCssSelector('##div#test-id-div[title="Share on Twitter"]');
    assert.equal('div#test-id-div[title="Share on Twitter"]', selector);

    selector = AdguardRulesConstructorLib.constructRuleCssSelector('http://test.com/page$domain=example.org');
    assert.equal(selector, "[src*=\"http://test.com/page\"]");

    selector = AdguardRulesConstructorLib.constructRuleCssSelector('||http://rutorads.com^$popup');
    assert.equal(selector, "[src*=\"http://rutorads.com\"]");

    selector = AdguardRulesConstructorLib.constructRuleCssSelector("#%#window.AG_onLoad = function(func) { if (window.addEventListener) { window.addEventListener('DOMContentLoaded', func); } };");
    assert.equal(selector);
});