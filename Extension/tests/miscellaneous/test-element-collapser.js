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