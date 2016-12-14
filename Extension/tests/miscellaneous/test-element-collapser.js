QUnit.test("Test Element Collapser", function(assert) {
    cleanUp();

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


    ElementCollapser.collapseElement(element, element.getAttribute('src'));
    style = window.getComputedStyle(element);
    assert.equal(style.display, 'none');
    assert.equal(element.style.cssText, 'display: none !important;');
});

QUnit.test("Test Empty Styles Element", function(assert) {
    cleanUp();

    var done = assert.async();

    var collapseStylesElement = document.getElementById('adguard-collapse-styles');
    assert.notOk(collapseStylesElement);

    var element = document.getElementById('test-div');

    ElementCollapser.hideElement(element);
    var style = window.getComputedStyle(element);
    assert.equal(style.display, 'none');

    collapseStylesElement = document.getElementById('adguard-collapse-styles');
    assert.ok(collapseStylesElement);

    ElementCollapser.unhideElement(element);
    style = window.getComputedStyle(element);
    assert.equal(style.display, 'block');

    setTimeout(function() {
        collapseStylesElement = document.getElementById('adguard-collapse-styles');
        assert.notOk(collapseStylesElement);

        done();
    }, 1000);
});

QUnit.test("Test Collapse by src", function(assert) {
    cleanUp();

    var element = document.getElementById('test-image');

    var style = window.getComputedStyle(element);
    assert.equal(style.display, 'inline');

    ElementCollapser.collapseElement(element, element.getAttribute('src'));
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


    ElementCollapser.collapseElement(element, element.getAttribute('src'), shadowRoot);
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

    ElementCollapser.collapseElement(element, element.getAttribute('src'), shadowRoot);
    style = window.getComputedStyle(element);
    assert.equal(style.display, 'none');
});

QUnit.test("Test Empty Styles Element with ShadowDOM ", function(assert) {
    cleanUp();

    var shadowRoot = createShadowRoot();
    if (!shadowRoot) {
        //can't run this test without shadowDOM support
        return;
    }

    var collapseStylesElement = shadowRoot.querySelector('#adguard-collapse-styles');
    assert.notOk(collapseStylesElement);

    var element = document.getElementById('test-div');

    ElementCollapser.hideElement(element, shadowRoot);
    var style = window.getComputedStyle(element);
    assert.equal(style.display, 'none');

    collapseStylesElement = shadowRoot.querySelector('#adguard-collapse-styles');
    assert.ok(collapseStylesElement);

    ElementCollapser.unhideElement(element, shadowRoot);
    style = window.getComputedStyle(element);
    assert.equal(style.display, 'block');

    //var done = assert.async();

    //setTimeout(function() {
    //    collapseStylesElement = shadowRoot.querySelector('#adguard-collapse-styles');
    //    assert.notOk(collapseStylesElement);
    //
    //    done();
    //}, 1000);
});

QUnit.test("Test Collapser with special characters in dom path", function(assert) {
    cleanUp();

    var element = document.getElementById('test-div-in-http');
    var style = window.getComputedStyle(element);
    assert.equal(style.display, 'block');

    ElementCollapser.hideBySelector('#test-div-in-http', null);
    style = window.getComputedStyle(element);
    assert.equal(style.display, 'none');

    ElementCollapser.unhideBySelector('#test-div-in-http');
    style = window.getComputedStyle(element);
    assert.equal(style.display, 'block');

    ElementCollapser.hideElement(element);
    style = window.getComputedStyle(element);
    assert.equal(style.display, 'none');

    ElementCollapser.unhideElement(element);
    style = window.getComputedStyle(element);
    assert.equal(style.display, 'block');
});

QUnit.test("Test Collapser with special characters in dom path with ShadowRoot", function(assert) {
    cleanUp();

    var shadowRoot = createShadowRoot();
    if (!shadowRoot) {
        //can't run this test without shadowDOM support
        return;
    }

    var element = document.getElementById('test-div-in-http');
    var style = window.getComputedStyle(element);
    assert.equal(style.display, 'block');

    ElementCollapser.hideBySelector('#test-div-in-http', null, shadowRoot);
    style = window.getComputedStyle(element);
    assert.equal(style.display, 'none');

    ElementCollapser.unhideBySelector('#test-div-in-http', shadowRoot);
    style = window.getComputedStyle(element);
    assert.equal(style.display, 'block');

    ElementCollapser.hideElement(element, shadowRoot);
    style = window.getComputedStyle(element);
    assert.equal(style.display, 'none');

    ElementCollapser.unhideElement(element, shadowRoot);
    style = window.getComputedStyle(element);
    assert.equal(style.display, 'block');
});

var cleanUp = function () {
    var el = document.getElementById('adguard-collapse-styles');
    if (el) {
        el.parentNode.removeChild(el);
    }

    var shadowRoot = createShadowRoot();
    if (shadowRoot) {
        var collapseStylesElement = shadowRoot.querySelector('#adguard-collapse-styles');
        if (collapseStylesElement) {
            shadowRoot.removeChild(collapseStylesElement);
        }
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