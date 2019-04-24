/* global ElementCollapser */

QUnit.test('Test Element Collapser', (assert) => {
    ElementCollapser.clear();

    assert.ok(ElementCollapser !== null);

    const element = document.getElementById('test-div');
    let style = window.getComputedStyle(element);
    assert.equal(style.display, 'block');
    assert.notOk(ElementCollapser.isCollapsed(element));

    ElementCollapser.collapseElement(element, element.getAttribute('src'));
    style = window.getComputedStyle(element);
    assert.equal(style.display, 'none');
    assert.equal(element.style.cssText, 'display: none !important;');
    assert.ok(ElementCollapser.isCollapsed(element));
    element.removeAttribute('style');
});

QUnit.test('Test Collapse by src', (assert) => {
    ElementCollapser.clear();

    const element = document.getElementById('test-image');

    let style = window.getComputedStyle(element);
    assert.equal(style.display, 'inline');
    assert.notOk(ElementCollapser.isCollapsed(element));

    ElementCollapser.collapseElement(element, element.src);
    style = window.getComputedStyle(element);
    assert.equal(style.display, 'none');
    assert.ok(ElementCollapser.isCollapsed(element));
});
