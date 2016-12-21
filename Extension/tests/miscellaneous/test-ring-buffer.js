/* global QUnit, RingBuffer */

QUnit.test("Test Ring Buffer", function (assert) {

    var bufferSize = 128;

    var key1 = 'key1';
    var ringBuffer = new RingBuffer(bufferSize);
    assert.ok(!ringBuffer.pop(key1));

    var item = ringBuffer.push(key1);
    assert.ok(!!item);
    assert.ok(!item.property);
    item.property = 'property';

    item = ringBuffer.pop(key1);
    assert.ok(!!item);
    assert.equal(item.property, 'property');

    item = ringBuffer.pop(key1);
    assert.ok(!item);

    item = ringBuffer.push(key1);
    item.property = 'property1';

    item = ringBuffer.push(key1);
    item.property = 'property2';

    item = ringBuffer.pop(key1);
    assert.ok(!!item);
    assert.equal(item.property, 'property2');

    item = ringBuffer.pop(key1);
    assert.ok(!!item);
    assert.equal(item.property, 'property1');

    ringBuffer.clear();
    assert.ok(!ringBuffer.pop(key1));

    var factor = 4;
    var itemsCount = bufferSize * factor;
    for (var i = 0; i < itemsCount; i++) {
        item = ringBuffer.push(key1 + '-1');
        item.property = 'property-1' + i;
        item = ringBuffer.push(key1 + '-2');
        item.property = 'property-2' + i;
    }

    for (i = 0; i < itemsCount; i++) {
        var item1 = ringBuffer.pop(key1 + '-1');
        var item2 = ringBuffer.pop(key1 + '-2');
        if (i >= itemsCount / factor / 2) {
            assert.ok(!item1);
            assert.ok(!item2);
        } else {
            assert.equal(item1.property, 'property-1' + (itemsCount - i - 1));
            assert.equal(item2.property, 'property-2' + (itemsCount - i - 1));
        }
    }
});