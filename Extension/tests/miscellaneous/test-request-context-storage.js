/* global QUnit */

QUnit.test("Test Record/Remove", function (assert) {

    const requestId = '1';
    const requestUrl = 'http://example.org/image.png';
    const referrerUrl = 'https://example.org';
    const requestType = adguard.RequestTypes.DOCUMENT;
    const tab = { tabId: 1 };

    assert.notOk(adguard.requestContextStorage.get(requestId));

    adguard.requestContextStorage.record(requestId, requestUrl, referrerUrl, referrerUrl, requestType, tab);

    let context = adguard.requestContextStorage.get(requestId);
    assert.ok(context);
    assert.equal(requestId, context.requestId);
    assert.equal(requestUrl, context.requestUrl);
    assert.equal(referrerUrl, context.referrerUrl);
    assert.equal(requestType, context.requestType);
    assert.equal(tab, context.tab);
    assert.ok(context.eventId > 0);
    assert.ok(context.requestState, 2);
    assert.ok(context.contentModifyingState, 1);

    adguard.requestContextStorage.onRequestCompleted(requestId);
    context = adguard.requestContextStorage.get(requestId);
    assert.notOk(context);
});

QUnit.test("Test Content modification", function (assert) {

    const requestId = '1';
    const requestUrl = 'http://example.org/image.png';
    const referrerUrl = 'https://example.org';
    const requestType = adguard.RequestTypes.DOCUMENT;
    const tab = { tabId: 1 };

    adguard.requestContextStorage.record(requestId, requestUrl, referrerUrl, referrerUrl, requestType, tab);
    adguard.requestContextStorage.onRequestCompleted(requestId);

    let context = adguard.requestContextStorage.get(requestId);
    assert.notOk(context);

    adguard.requestContextStorage.record(requestId, requestUrl, referrerUrl, referrerUrl, requestType, tab);
    adguard.requestContextStorage.onContentModificationStarted(requestId);
    adguard.requestContextStorage.onRequestCompleted(requestId);

    context = adguard.requestContextStorage.get(requestId);
    assert.ok(context);

    adguard.requestContextStorage.onContentModificationFinished(requestId);

    context = adguard.requestContextStorage.get(requestId);
    assert.notOk(context);
});

QUnit.test("Test Modify headers", function (assert) {

    const requestId = '1';
    const requestUrl = 'http://example.org/image.png';
    const referrerUrl = 'https://example.org';
    const requestType = adguard.RequestTypes.DOCUMENT;
    const tab = { tabId: 1 };

    adguard.requestContextStorage.record(requestId, requestUrl, referrerUrl, referrerUrl, requestType, tab);

    // allow null values
    adguard.requestContextStorage.update(requestId, { requestHeaders: null });
    adguard.requestContextStorage.update(requestId, { responseHeaders: null });

    const requestHeaders = [{ name: 'header-1', value: 'value-1' }];
    const responseHeaders = [{ name: 'header-2', value: 'value-2' }];

    adguard.requestContextStorage.update(requestId, { requestHeaders });
    adguard.requestContextStorage.update(requestId, { responseHeaders });

    const context = adguard.requestContextStorage.get(requestId);
    assert.equal(1, context.requestHeaders.length);
    assert.equal(1, context.responseHeaders.length);

    // Modify request headers
    const modifiedRequestHeaders = [{
        name: 'header-1',
        value: 'value-2',
    }, {
        name: 'header-3',
        value: 'value-3',
    }];
    adguard.requestContextStorage.update(requestId, { modifiedRequestHeaders });

    assert.equal(1, context.requestHeaders.length);
    assert.equal('header-1', context.requestHeaders[0].name);
    assert.equal('value-1', context.requestHeaders[0].value);

    assert.equal(2, context.modifiedRequestHeaders.length);
    assert.equal('header-1', context.modifiedRequestHeaders[0].name);
    assert.equal('value-2', context.modifiedRequestHeaders[0].value);

    assert.equal(2, context.modifiedRequestHeaders.length);
    assert.equal('header-3', context.modifiedRequestHeaders[1].name);
    assert.equal('value-3', context.modifiedRequestHeaders[1].value);

    // Modify response headers
    const modifiedResponseHeaders = [{
        name: 'header-2',
        value: 'value-1',
    }, {
        name: 'header-4',
        value: 'value-4',
    }];
    adguard.requestContextStorage.update(requestId, { modifiedResponseHeaders });

    assert.equal(1, context.responseHeaders.length);
    assert.equal('header-2', context.responseHeaders[0].name);
    assert.equal('value-2', context.responseHeaders[0].value);

    assert.equal(2, context.modifiedResponseHeaders.length);
    assert.equal('header-2', context.modifiedResponseHeaders[0].name);
    assert.equal('value-1', context.modifiedResponseHeaders[0].value);

    assert.equal(2, context.modifiedResponseHeaders.length);
    assert.equal('header-4', context.modifiedResponseHeaders[1].name);
    assert.equal('value-4', context.modifiedResponseHeaders[1].value);
});

QUnit.test("Test Update", function (assert) {

    const requestId = '1';
    const requestUrl = 'http://example.org/image.png';
    const referrerUrl = 'https://example.org';
    const requestType = adguard.RequestTypes.DOCUMENT;
    const tab = { tabId: 1 };

    const requestRule = { filterId: 1, ruleText: 'text' };
    const replaceRule1 = { filterId: 1, ruleText: 'text' };
    const cspRules = [{ filterId: 1, ruleText: 'text' }, { filterId: 1, ruleText: 'text' }];
    const contentRule1 = { filterId: 1, ruleText: 'text' };
    const elementHtml1 = '<script></script>';
    const contentRule2 = { filterId: 1, ruleText: 'text' };
    const elementHtml2 = '<script></script>';

    adguard.requestContextStorage.record(requestId, requestUrl, referrerUrl, referrerUrl, requestType, tab);

    adguard.requestContextStorage.update(requestId, { requestRule });
    adguard.requestContextStorage.update(requestId, { replaceRules: [replaceRule1] });
    adguard.requestContextStorage.update(requestId, { cspRules });
    adguard.requestContextStorage.bindContentRule(requestId, contentRule1, elementHtml1);
    adguard.requestContextStorage.bindContentRule(requestId, contentRule2, elementHtml2);

    const context = adguard.requestContextStorage.get(requestId);
    assert.ok(context);
    assert.equal(requestRule, context.requestRule);
    assert.equal(replaceRule1, context.replaceRules[0]);
    assert.equal(2, context.cspRules.length);
    assert.equal(cspRules[0], context.cspRules[0]);
    assert.equal(cspRules[1], context.cspRules[1]);
    assert.equal(2, context.contentRules.length);
    assert.equal(contentRule1, context.contentRules[0]);
    assert.equal(contentRule2, context.contentRules[1]);
    assert.equal(elementHtml1, context.elements.get(contentRule1));
    assert.equal(elementHtml2, context.elements.get(contentRule2));
});
