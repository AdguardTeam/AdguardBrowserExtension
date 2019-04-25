QUnit.test('Test Encodings', (assert) => {
    function testEncodeDecode(charset) {
        const encoder = new TextEncoder(charset, { NONSTANDARD_allowLegacyEncoding: true });
        const decoder = new TextDecoder(charset, { NONSTANDARD_allowLegacyEncoding: true });

        for (let i = 0; i < 65533; i += 1) {
            const bytes = encoder.encode(String.fromCharCode(i));
            decoder.decode(bytes);
            if (i <= 0x7F) {
                assert.equal(i, bytes[0]);
            }
        }
    }

    testEncodeDecode('utf-8');
    testEncodeDecode('windows-1251');
    testEncodeDecode('windows-1252');

    // Some specific cases

    // Fallback to windows-1252
    const encoder = new TextEncoder('windows-1251', { NONSTANDARD_allowLegacyEncoding: true });
    const bytes = encoder.encode(String.fromCharCode(244));
    assert.equal(244, bytes[0]);

    // Fallback to replacement
    assert.equal(63, encoder.encode('Ⓢ')[0]);
});
