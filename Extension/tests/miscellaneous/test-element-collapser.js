QUnit.test("Test Element Collapser", function(assert) {
    assert.ok(ElementCollapser != null);

    var element = document.getElementById('test-div');
    var style = window.getComputedStyle(element);
    assert.equal(style.display, 'block');

    ElementCollapser.hideElement(element);
    style = window.getComputedStyle(element);
    assert.equal(style.display, 'none');

    ElementCollapser.unhideElement(element);
    style = window.getComputedStyle(element);
    assert.equal(style.display, 'block');

    ElementCollapser.hideBySelector('#test-div', 'background-color:#366097;');
    style = window.getComputedStyle(element);
    assert.equal(style.display, 'block');
    assert.equal(style['background-color'], 'rgb(54, 96, 151)');

    ElementCollapser.unhideBySelector('#test-div');
    style = window.getComputedStyle(element);
    assert.equal(style.display, 'block');
    assert.equal(style['background-color'], 'rgba(0, 0, 0, 0)');


    ElementCollapser.collapseElement(element);
    style = window.getComputedStyle(element);
    assert.equal(style.display, 'none');
    assert.equal(element.style.cssText, 'display: none !important;');
});

QUnit.test("Test Collapse by src", function(assert) {
    var element = document.getElementById('test-image');

    var style = window.getComputedStyle(element);
    assert.equal(style.display, 'inline');

    ElementCollapser.collapseElement(element);
    style = window.getComputedStyle(element);
    assert.equal(style.display, 'none');
});

QUnit.test("Test Collapser with shadowDOM", function(assert) {
    cleanUp();

    var shadowRoot = createShadowRoot();
    if (!shadowRoot) {
        //can't run this test without shadowDOM support
        return;
    }

    var element = document.getElementById('test-div-shadow');
    var style = window.getComputedStyle(element);
    assert.equal(style.display, 'block');

    ElementCollapser.hideBySelector('#test-div-shadow', null, shadowRoot);
    style = window.getComputedStyle(element);
    assert.equal(style.display, 'none');

    ElementCollapser.unhideBySelector('#test-div-shadow', shadowRoot);
    style = window.getComputedStyle(element);
    assert.equal(style.display, 'block');

    ElementCollapser.hideElement(element, shadowRoot);
    style = window.getComputedStyle(element);
    assert.equal(style.display, 'none');

    ElementCollapser.unhideElement(element, shadowRoot);
    style = window.getComputedStyle(element);
    assert.equal(style.display, 'block');

    ElementCollapser.hideBySelector('#test-div-shadow', 'background-color:#366097;', shadowRoot);
    style = window.getComputedStyle(element);
    assert.equal(style.display, 'block');
    assert.equal(style['background-color'], 'rgb(54, 96, 151)');

    ElementCollapser.unhideBySelector('#test-div-shadow', shadowRoot);
    style = window.getComputedStyle(element);
    assert.equal(style.display, 'block');
    assert.equal(style['background-color'], 'rgba(0, 0, 0, 0)');


    ElementCollapser.collapseElement(element, shadowRoot);
    style = window.getComputedStyle(element);
    assert.equal(style.display, 'none');
    assert.equal(element.style.cssText, 'display: none !important;');

});

QUnit.test("Test Collapse by src with shadowDOM", function(assert) {
    cleanUp();

    var shadowRoot = createShadowRoot();
    if (!shadowRoot) {
        //can't run this test without shadowDOM support
        return;
    }

    var element = document.getElementById('test-image-shadow');

    var style = window.getComputedStyle(element);
    assert.equal(style.display, 'inline');

    ElementCollapser.collapseElement(element, shadowRoot);
    style = window.getComputedStyle(element);
    assert.equal(style.display, 'none');
});

var cleanUp = function () {
    var el = document.getElementById('adguard-collapse-styles');
    if (el) {
        el.parentNode.removeChild(el);
    }
};

var createShadowRoot = function () {
    var shadowRoot = document.documentElement.shadowRoot;
    if (!shadowRoot) {
        if ("createShadowRoot" in document.documentElement) {
            shadowRoot = document.documentElement.createShadowRoot();
            shadowRoot.appendChild(document.createElement("shadow"));
        }
    }

    return shadowRoot;
};