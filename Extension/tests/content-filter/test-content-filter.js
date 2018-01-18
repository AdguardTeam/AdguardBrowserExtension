/* global QUnit */

/**
 * Phantomjs doesn't support DOMParser.parseFromString for HTML documents
 * @param html
 * @returns Document
 */
function createDOMFromHTML(html) {
    var doc = document.implementation.createHTMLDocument("example");
    doc.documentElement.innerHTML = html;
    return doc;
}

QUnit.test("testContentFilterRule", function (assert) {

    var ruleText = "~nigma.ru,google.com$$div[id=\"ad_text\"][tag-content=\"teas\"\"ernet\"][max-length=\"500\"][min-length=\"50\"][wildcard=\"*.adriver.*\"][parent-search-level=\"15\"][parent-elements=\"td,table\"]";
    var rule = new adguard.rules.ContentFilterRule(ruleText);

    assert.equal("div", rule.tagName);
    assert.ok(rule.getRestrictedDomains().indexOf("nigma.ru") >= 0);
    assert.ok(rule.getPermittedDomains().indexOf("google.com") >= 0);
    assert.equal("teas\"ernet", rule.tagContentFilter);
    assert.equal("div[id*=\"ad_text\"]", rule.selector);
    assert.equal(500, rule.maxLength);
    assert.equal(50, rule.minLength);
    assert.equal("^[\\s\\S]*\\.adriver\\.[\\s\\S]*$", rule.wildcard.regexp.source);
    assert.equal(15, rule.parentSearchLevel);
    assert.equal(2, rule.parentElements.length);
    assert.ok(rule.parentElements.indexOf("td") >= 0);
    assert.ok(rule.parentElements.indexOf("table") >= 0);
});

QUnit.test("testContentFilterWildcardRuleWork", function (assert) {

    var ruleText = "~nigma.ru,google.com$$div[id=\"ad_text\"][wildcard=\"*teasernet*tararar*\"]";
    var rule = new adguard.rules.ContentFilterRule(ruleText);

    var html = "<html><body><div id=\"ad_text\">tratata teasernet\n \ntararar</div></body></html>";
    var doc = createDOMFromHTML(html);

    var element = doc.getElementsByTagName("div")[0];
    assert.ok(rule.getMatchedElements(doc).indexOf(element) >= 0);
});

QUnit.test("testContentFilterWildcardRuleEscapedCharacter", function (assert) {

    var ruleText = "test.com$$div[wildcard=\"*Test*[123]{123}*\"]";
    var rule = new adguard.rules.ContentFilterRule(ruleText);

    var html = "<html><body><div>Testtest [123]{123}</div></body></html>";
    var doc = createDOMFromHTML(html);

    var element = doc.getElementsByTagName("div")[0];
    assert.ok(rule.getMatchedElements(doc).indexOf(element) >= 0);
});


QUnit.test("testContentFilterRuleWork", function (assert) {

    var ruleText = "~nigma.ru,google.com$$div[id=\"ad_text\"][tag-content=\"teasernet\"]";
    var rule = new adguard.rules.ContentFilterRule(ruleText);

    var html = "<html><body><div id=\"ad_text\">tratata teasernet tararar</div></body></html>";
    var doc = createDOMFromHTML(html);

    var element = doc.getElementsByTagName("div")[0];
    assert.ok(rule.getMatchedElements(doc).indexOf(element) >= 0);
});


QUnit.test("testContentFilter", function (assert) {

    var rule = new adguard.rules.ContentFilterRule("~nigma.ru,google.com$$div[id=\"ad_text\"][tag-content=\"teasernet\"]");
    var rule1 = new adguard.rules.ContentFilterRule("google.com$$div[class=\"ad_block\"");

    var filter = new adguard.rules.ContentFilter([rule, rule1]);

    var html = "<html><body><div id=\"ad_text\">tratata teasernet tararar</div></body></html>";
    var doc = createDOMFromHTML(html);
    var element = doc.getElementsByTagName("div")[0];

    assert.ok(rule.getMatchedElements(doc).indexOf(element) >= 0);
    assert.ok(filter.getMatchedElements(doc, "google.com").indexOf(element) >= 0);
    assert.ok(filter.getMatchedElements(doc, "nigma.ru") === null);
});

QUnit.test("testContentRuleExceptions", function (assert) {

    var elementsFilter = "script[tag-content=\"test\"]";
    var rule = new adguard.rules.ContentFilterRule("google.com,yandex.ru$$" + elementsFilter);
    var exceptionRule = new adguard.rules.ContentFilterRule("yandex.ru$@$" + elementsFilter);

    var html = "<html><body><script>test</script></body></html>";
    var doc = createDOMFromHTML(html);
    var element = doc.getElementsByTagName("script")[0];

    var contentFilter = new adguard.rules.ContentFilter();
    contentFilter.addRule(rule);
    assert.ok(contentFilter.getMatchedElements(doc, "yandex.ru").indexOf(element) >= 0);

    contentFilter.addRule(exceptionRule);
    assert.ok(contentFilter.getMatchedElements(doc, "yandex.ru") === null);
    assert.ok(contentFilter.getMatchedElements(doc, "google.com").indexOf(element) >= 0);

    contentFilter.removeRule(exceptionRule);
    assert.ok(contentFilter.getMatchedElements(doc, "yandex.ru").indexOf(element) >= 0);
});

QUnit.test("testWildcardShortcut", function (assert) {

    var Wildcard = adguard.rules.Wildcard;

    assert.equal("tarara", (new Wildcard("*tarara*trtr*tr??").shortcut));
    assert.equal("this is it", (new Wildcard("this is it*trtr*tr??").shortcut));
    assert.equal("longest string", (new Wildcard("*tarara*trtr*this is?longest string").shortcut));
    assert.equal("longest string", (new Wildcard("*tarara*trtr*this is?longest string*").shortcut));

    assert.ok((new Wildcard("*TEST ?STRING*")).matches("tatatatataTEST _STRINGbabababah"));
    assert.notOk((new Wildcard("*TEST ?STRING*")).matches("tatatatataTEST STRINGbabababah"));
});