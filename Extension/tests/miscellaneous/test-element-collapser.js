QUnit.test("Test Element Collapser", function(assert) {
    ElementCollapser.clear();

    assert.ok(ElementCollapser != null);

    var element = document.getElementById('test-div');
    var style = window.getComputedStyle(element);
    assert.equal(style.display, 'block');
    assert.notOk(ElementCollapser.isCollapsed(element));

    ElementCollapser.collapseElement(element, element.getAttribute('src'));
    style = window.getComputedStyle(element);
    assert.equal(style.display, 'none');
    assert.equal(element.style.cssText, 'display: none !important;');
    assert.ok(ElementCollapser.isCollapsed(element));
    element.removeAttribute('style');
});

QUnit.test("Test Collapse by src", function(assert) {
    ElementCollapser.clear();

    var element = document.getElementById('test-image');

    var style = window.getComputedStyle(element);
    assert.equal(style.display, 'inline');
    assert.notOk(ElementCollapser.isCollapsed(element));

    ElementCollapser.collapseElement(element, element.src);
    style = window.getComputedStyle(element);
    assert.equal(style.display, 'none');
    assert.ok(ElementCollapser.isCollapsed(element));
});