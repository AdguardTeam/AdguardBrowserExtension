import { requestContextStorage } from '../../../Extension/lib/filter/request-context-storage';
import { RequestTypes } from '../../../Extension/lib/utils/request-types';

jest.mock('../../../Extension/lib/filter/filtering-log');

describe('requestContextStorage', () => {
    it('Test Record/Remove', () => {
        const requestId = '1';
        const requestUrl = 'http://example.org/image.png';
        const referrerUrl = 'https://example.org';
        const requestType = RequestTypes.DOCUMENT;
        const tab = { tabId: 1 };

        expect(requestContextStorage.get(requestId)).toBeFalsy();

        requestContextStorage.record(requestId, requestUrl, referrerUrl, referrerUrl, requestType, tab);

        let context = requestContextStorage.get(requestId);
        expect(context).toBeTruthy();
        expect(requestId).toBe(context.requestId);
        expect(requestUrl).toBe(context.requestUrl);
        expect(referrerUrl).toBe(context.referrerUrl);
        expect(requestType).toBe(context.requestType);
        expect(tab).toBe(context.tab);
        expect(context.eventId).toBeGreaterThan(0);
        expect(context.requestState).toBe(2);
        expect(context.contentModifyingState).toBe(1);

        requestContextStorage.onRequestCompleted(requestId);
        context = requestContextStorage.get(requestId);
        expect(context).toBeFalsy();
    });

    it('Test Content modification', () => {
        const requestId = '1';
        const requestUrl = 'http://example.org/image.png';
        const referrerUrl = 'https://example.org';
        const requestType = RequestTypes.DOCUMENT;
        const tab = { tabId: 1 };

        requestContextStorage.record(requestId, requestUrl, referrerUrl, referrerUrl, requestType, tab);
        requestContextStorage.onRequestCompleted(requestId);

        let context = requestContextStorage.get(requestId);
        expect(context).toBeFalsy();

        requestContextStorage.record(requestId, requestUrl, referrerUrl, referrerUrl, requestType, tab);
        requestContextStorage.onContentModificationStarted(requestId);
        requestContextStorage.onRequestCompleted(requestId);

        context = requestContextStorage.get(requestId);
        expect(context).toBeTruthy();

        requestContextStorage.onContentModificationFinished(requestId);

        context = requestContextStorage.get(requestId);
        expect(context).toBeFalsy();
    });

    it('Test Modify headers', () => {
        const requestId = '1';
        const requestUrl = 'http://example.org/image.png';
        const referrerUrl = 'https://example.org';
        const requestType = RequestTypes.DOCUMENT;
        const tab = { tabId: 1 };

        requestContextStorage.record(requestId, requestUrl, referrerUrl, referrerUrl, requestType, tab);

        // allow null values
        requestContextStorage.update(requestId, { requestHeaders: null });
        requestContextStorage.update(requestId, { responseHeaders: null });

        const requestHeaders = [{ name: 'header-1', value: 'value-1' }];
        const responseHeaders = [{ name: 'header-2', value: 'value-2' }];

        requestContextStorage.update(requestId, { requestHeaders });
        requestContextStorage.update(requestId, { responseHeaders });

        const context = requestContextStorage.get(requestId);
        expect(context.requestHeaders.length).toEqual(1);
        expect(context.responseHeaders.length).toEqual(1);

        // Modify request headers
        const modifiedRequestHeaders = [{
            name: 'header-1',
            value: 'value-2',
        }, {
            name: 'header-3',
            value: 'value-3',
        }];
        requestContextStorage.update(requestId, { modifiedRequestHeaders });

        expect(context.requestHeaders).toHaveLength(1);
        expect(context.requestHeaders[0].name).toBe('header-1');
        expect(context.requestHeaders[0].value).toBe('value-1');

        expect(context.modifiedRequestHeaders).toHaveLength(2);
        expect(context.modifiedRequestHeaders[0].name).toBe('header-1');
        expect(context.modifiedRequestHeaders[0].value).toBe('value-2');

        expect(context.modifiedRequestHeaders).toHaveLength(2);
        expect(context.modifiedRequestHeaders[1].name).toBe('header-3');
        expect(context.modifiedRequestHeaders[1].value).toBe('value-3');

        // Modify response headers
        const modifiedResponseHeaders = [{
            name: 'header-2',
            value: 'value-1',
        }, {
            name: 'header-4',
            value: 'value-4',
        }];
        requestContextStorage.update(requestId, { modifiedResponseHeaders });

        expect(context.responseHeaders).toHaveLength(1);
        expect(context.responseHeaders[0].name).toBe('header-2');
        expect(context.responseHeaders[0].value).toBe('value-2');

        expect(context.modifiedResponseHeaders).toHaveLength(2);
        expect(context.modifiedResponseHeaders[0].name).toBe('header-2');
        expect(context.modifiedResponseHeaders[0].value).toBe('value-1');

        expect(context.modifiedResponseHeaders).toHaveLength(2);
        expect(context.modifiedResponseHeaders[1].name).toBe('header-4');
        expect(context.modifiedResponseHeaders[1].value).toBe('value-4');
    });

    it('Test Update', () => {
        const requestId = '1';
        const requestUrl = 'http://example.org/image.png';
        const referrerUrl = 'https://example.org';
        const requestType = RequestTypes.DOCUMENT;
        const tab = { tabId: 1 };

        const requestRule = { filterId: 1, ruleText: 'text' };
        const replaceRule1 = { filterId: 1, ruleText: 'text' };
        const cspRules = [{ filterId: 1, ruleText: 'text' }, { filterId: 1, ruleText: 'text' }];
        const contentRule1 = { filterId: 1, ruleText: 'text' };
        const elementHtml1 = '<script></script>';
        const contentRule2 = { filterId: 1, ruleText: 'text' };
        const elementHtml2 = '<script></script>';

        requestContextStorage.record(requestId, requestUrl, referrerUrl, referrerUrl, requestType, tab);

        requestContextStorage.update(requestId, { requestRule });
        requestContextStorage.update(requestId, { replaceRules: [replaceRule1] });
        requestContextStorage.update(requestId, { cspRules });
        requestContextStorage.bindContentRule(requestId, contentRule1, elementHtml1);
        requestContextStorage.bindContentRule(requestId, contentRule2, elementHtml2);

        const context = requestContextStorage.get(requestId);
        expect(context).toBeTruthy();
        expect(context.requestRule).toEqual(requestRule);
        expect(context.replaceRules[0]).toEqual(replaceRule1);
        expect(context.cspRules).toHaveLength(2);
        expect(context.cspRules[0]).toBe(cspRules[0]);
        expect(context.cspRules[1]).toBe(cspRules[1]);
        expect(context.contentRules).toHaveLength(2);
        expect(context.contentRules[0]).toEqual(contentRule1);
        expect(context.contentRules[1]).toEqual(contentRule2);
        expect(context.elements.get(contentRule1)).toEqual([elementHtml1]);
        expect(context.elements.get(contentRule2)).toEqual([elementHtml2]);
    });
});
