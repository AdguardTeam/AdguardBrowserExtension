/* global QUnit */

QUnit.test('Test Ring Buffer', (assert) => {
    function newItem(prop) {
        return { property: prop };
    }

    const bufferSize = 128;

    const key1 = 'key1';
    const ringBuffer = new adguard.utils.RingBuffer(bufferSize);
    assert.ok(!ringBuffer.pop(key1));

    ringBuffer.put(key1, newItem('property'));

    let item = ringBuffer.pop(key1);
    assert.ok(!!item);
    assert.equal(item.property, 'property');

    item = ringBuffer.pop(key1);
    assert.ok(!item);

    ringBuffer.put(key1, newItem('property1'));
    ringBuffer.put(key1, newItem('property2'));

    item = ringBuffer.pop(key1);
    assert.ok(!!item);
    assert.equal(item.property, 'property2');

    item = ringBuffer.pop(key1);
    assert.ok(!!item);
    assert.equal(item.property, 'property1');

    ringBuffer.clear();
    assert.ok(!ringBuffer.pop(key1));

    const factor = 4;
    const itemsCount = bufferSize * factor;
    for (let i = 0; i < itemsCount; i += 1) {
        ringBuffer.put(`${key1}-1`, newItem(`property-1${i}`));
        ringBuffer.put(`${key1}-2`, newItem(`property-2${i}`));
    }

    for (let i = 0; i < itemsCount; i += 1) {
        const item1 = ringBuffer.pop(`${key1}-1`);
        const item2 = ringBuffer.pop(`${key1}-2`);
        if (i >= itemsCount / factor / 2) {
            assert.ok(!item1);
            assert.ok(!item2);
        } else {
            assert.equal(item1.property, `property-1${itemsCount - i - 1}`);
            assert.equal(item2.property, `property-2${itemsCount - i - 1}`);
        }
    }
});
