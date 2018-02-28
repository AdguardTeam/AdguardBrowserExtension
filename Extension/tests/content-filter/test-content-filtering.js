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

QUnit.test("Test content filtering - charsets", function (assert) {
    let textEncoder = new TextEncoder();
    let textDecoder = new TextDecoder();

    let filter = adguard.webRequest.filterResponseData(1);
    let received;
    let data;

    data = 'some data';
    adguard.contentFiltering.apply({}, 'http://example.org', null, adguard.RequestTypes.DOCUMENT, 1, 200, 'GET', '');
    filter.send(textEncoder.encode('some data'));
    received = textDecoder.decode(filter.receive());
    assert.ok(received);
    assert.equal(received, data);

    data = 'utf-8 in header';
    adguard.contentFiltering.apply({}, 'http://example.org', null, adguard.RequestTypes.DOCUMENT, 1, 200, 'GET', 'text/html; charset=utf-8');
    filter.send(textEncoder.encode(data));
    received = textDecoder.decode(filter.receive());
    assert.ok(received);
    assert.equal(received, data);

    data = 'unsupported charset in header - request is skipped';
    adguard.contentFiltering.apply({}, 'http://example.org', null, adguard.RequestTypes.DOCUMENT, 1, 200, 'GET', 'text/html; charset=koi8-r');
    filter.send(textEncoder.encode(data));
    assert.notOk(filter.receive());

    data = 'no charset in header';
    adguard.contentFiltering.apply({}, 'http://example.org', null, adguard.RequestTypes.DOCUMENT, 1, 200, 'GET', 'text/html');
    filter.send(textEncoder.encode(data));
    received = textDecoder.decode(filter.receive());
    assert.ok(received);
    assert.equal(received, data);

    data = 'charset in data <meta charset="UTF-8">';
    adguard.contentFiltering.apply({}, 'http://example.org', null, adguard.RequestTypes.DOCUMENT, 1, 200, 'GET', 'text/html');
    filter.send(textEncoder.encode(data));
    received = textDecoder.decode(filter.receive());
    assert.ok(received);
    assert.equal(received, data);

    data = 'charset in data <meta charset="windows-1251">';
    adguard.contentFiltering.apply({}, 'http://example.org', null, adguard.RequestTypes.DOCUMENT, 1, 200, 'GET', 'text/html');
    filter.send(textEncoder.encode(data));
    received = textDecoder.decode(filter.receive());
    assert.ok(received);
    assert.equal(received, data);

    data = 'charset in data <meta http-equiv="content-type" content="text/html; charset=windows-1251">';
    adguard.contentFiltering.apply({}, 'http://example.org', null, adguard.RequestTypes.DOCUMENT, 1, 200, 'GET', 'text/html');
    filter.send(textEncoder.encode(data));
    received = textDecoder.decode(filter.receive());
    assert.ok(received);
    assert.equal(received, data);

    data = 'unsupported charset in data <meta charset="koi8-r">';
    adguard.contentFiltering.apply({}, 'http://example.org', null, adguard.RequestTypes.DOCUMENT, 1, 200, 'GET', 'text/html');
    filter.send(textEncoder.encode(data));
    received = textDecoder.decode(filter.receive());
    assert.ok(received);
    assert.equal(received, data);
});