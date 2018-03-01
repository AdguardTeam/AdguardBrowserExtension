/* global QUnit */

adguard.prefs.features.responseContentFilteringSupported = true;

adguard.webRequestService = adguard.webRequestService || {};
adguard.webRequestService.getContentRules = function () {
    return [ new adguard.rules.ContentFilterRule('example.org$$p') ];
};
adguard.webRequestService.getRuleForRequest = function () {
    return null;
};

adguard.webRequest = adguard.webRequest || {};

var content;
var singleton;

adguard.webRequest.filterResponseData = function () {
    if (singleton) {
        return singleton;
    }

    var send = function (data) {
        singleton.ondata({
            data: data
        });

        singleton.onstop();
    };

    var write = function (data) {
        content = data;
    };

    var receive = function () {
        var result = content;
        content = '';

        return result;
    };

    var close = function () {
        // Do nothing;
    };

    singleton = {
        send: send,
        receive: receive,
        write: write,
        close: close
    };

    return singleton;
};

QUnit.test("Test content filtering - encoders", function (assert) {
    let textEncoderUtf8 = new TextEncoder();
    let textDecoderUtf8 = new TextDecoder();

    let message = 'test 123';

    let encoded = textEncoderUtf8.encode(message);
    let decoded = textDecoderUtf8.decode(encoded);
    assert.equal(decoded, message);

    let textEncoderWin1251 = new TextEncoder('windows-1251', { NONSTANDARD_allowLegacyEncoding: true });
    let textDecoderWin1251 = new TextDecoder('windows-1251');

    encoded = textEncoderWin1251.encode(message);
    decoded = textDecoderWin1251.decode(encoded);
    assert.equal(decoded, message);

    let textEncoderIso8859 = new TextEncoder('windows-1252', { NONSTANDARD_allowLegacyEncoding: true });
    let textDecoderIso8859 = new TextDecoder('windows-1252');

    encoded = textEncoderIso8859.encode(message);
    decoded = textDecoderIso8859.decode(encoded);
    assert.equal(decoded, message);
});

QUnit.test("Test content filtering - charsets", function (assert) {
    let textEncoderUtf8 = new TextEncoder('utf-8');
    let textDecoderUtf8 = new TextDecoder('utf-8');

    let textEncoderWin1251 = new TextEncoder('windows-1251', { NONSTANDARD_allowLegacyEncoding: true });
    let textDecoderWin1251 = new TextDecoder('windows-1251');

    let textEncoderIso8859 = new TextEncoder('windows-1252', { NONSTANDARD_allowLegacyEncoding: true });
    let textDecoderIso8859 = new TextDecoder('windows-1252');

    let filter = adguard.webRequest.filterResponseData(1);
    let received;
    let data;

    data = 'some data';
    adguard.contentFiltering.apply({}, 'http://example.org', null, adguard.RequestTypes.DOCUMENT, 1, 200, 'GET', '');
    filter.send(textEncoderUtf8.encode('some data'));
    received = textDecoderUtf8.decode(filter.receive());
    assert.ok(received);
    assert.equal(received, data);

    data = 'utf-8 in header';
    adguard.contentFiltering.apply({}, 'http://example.org', null, adguard.RequestTypes.DOCUMENT, 1, 200, 'GET', 'text/html; charset=utf-8');
    filter.send(textEncoderUtf8.encode(data));
    received = textDecoderUtf8.decode(filter.receive());
    assert.ok(received);
    assert.equal(received, data);

    data = 'Тест windows-1251 in header';
    adguard.contentFiltering.apply({}, 'http://example.org', null, adguard.RequestTypes.DOCUMENT, 1, 200, 'GET', 'text/html; charset=windows-1251');
    filter.send(textEncoderWin1251.encode(data));
    received = textDecoderWin1251.decode(filter.receive());
    assert.ok(received);
    assert.equal(received, data);

    data = 'unsupported charset in header - request is skipped';
    adguard.contentFiltering.apply({}, 'http://example.org', null, adguard.RequestTypes.DOCUMENT, 1, 200, 'GET', 'text/html; charset=koi8-r');
    filter.send(textEncoderUtf8.encode(data));
    assert.notOk(filter.receive());

    data = 'no charset in header';
    adguard.contentFiltering.apply({}, 'http://example.org', null, adguard.RequestTypes.DOCUMENT, 1, 200, 'GET', 'text/html');
    filter.send(textEncoderUtf8.encode(data));
    received = textDecoderUtf8.decode(filter.receive());
    assert.ok(received);
    assert.equal(received, data);

    data = 'Тест charset in data <meta charset="UTF-8">';
    adguard.contentFiltering.apply({}, 'http://example.org', null, adguard.RequestTypes.DOCUMENT, 1, 200, 'GET', 'text/html');
    filter.send(textEncoderUtf8.encode(data));
    received = textDecoderUtf8.decode(filter.receive());
    assert.ok(received);
    assert.equal(received, data);

    data = 'Тест charset in data <meta charset="windows-1251">';
    adguard.contentFiltering.apply({}, 'http://example.org', null, adguard.RequestTypes.DOCUMENT, 1, 200, 'GET', 'text/html');
    filter.send(textEncoderWin1251.encode(data));
    received = textDecoderWin1251.decode(filter.receive());
    assert.ok(received);
    assert.equal(received, data);

    data = 'Charset in data <meta charset="windows-1252">';
    adguard.contentFiltering.apply({}, 'http://example.org', null, adguard.RequestTypes.DOCUMENT, 1, 200, 'GET', 'text/html');
    filter.send(textEncoderIso8859.encode(data));
    received = textDecoderIso8859.decode(filter.receive());
    assert.ok(received);
    assert.equal(received, data);

    data = 'Тест charset in data <meta http-equiv="content-type" content="text/html; charset=windows-1251">';
    adguard.contentFiltering.apply({}, 'http://example.org', null, adguard.RequestTypes.DOCUMENT, 1, 200, 'GET', 'text/html');
    filter.send(textEncoderWin1251.encode(data));
    received = textDecoderWin1251.decode(filter.receive());
    assert.ok(received);
    assert.equal(received, data);

    data = 'unsupported charset in data <meta charset="koi8-r">';
    adguard.contentFiltering.apply({}, 'http://example.org', null, adguard.RequestTypes.DOCUMENT, 1, 200, 'GET', 'text/html');
    filter.send(textEncoderUtf8.encode(data));
    received = textDecoderUtf8.decode(filter.receive());
    assert.ok(received);
    assert.equal(received, data);
});