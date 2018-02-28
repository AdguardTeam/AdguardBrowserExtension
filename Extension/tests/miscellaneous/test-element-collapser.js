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
    element.removeAttribute('style');
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

var cleanUp = function () {
    var el = document.getElementById('adguard-collapse-styles');
    if (el) {
        el.parentNode.removeChild(el);
    }
};
