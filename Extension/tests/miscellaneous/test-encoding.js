/* global QUnit */

QUnit.test("Test Encodings", function (assert) {

    function testEncodeDecode(charset) {

        var encoder = new TextEncoder(charset, { NONSTANDARD_allowLegacyEncoding: true });
        var decoder = new TextDecoder(charset, { NONSTANDARD_allowLegacyEncoding: true });

        for (var i = 0; i < 65533; i++) {
            var bytes = encoder.encode(String.fromCharCode(i));
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
    var encoder = new TextEncoder('windows-1251', { NONSTANDARD_allowLegacyEncoding: true });
    var bytes = encoder.encode(String.fromCharCode(244));
    assert.equal(244, bytes[0]);

    // Fallback to replacement
    assert.equal(63, encoder.encode("Ⓢ")[0]);
});