import { documentFilterService } from '../../../../../Extension/src/background/filter/services/document-filter';
import { backgroundPage } from '../../../../../Extension/src/background/extension-api/background-page';

jest.spyOn(backgroundPage, 'getURL').mockImplementation(url => url);

describe('documentFilterService', () => {
    it('returns url for not trusted url', () => {
        const url = 'https://example.org/';
        const ruleText = '||example.org^$document';

        const blockingUrl = documentFilterService.getDocumentBlockPageUrl(url, ruleText);
        // eslint-disable-next-line max-len
        expect(blockingUrl).toBe('pages/ad-blocked.html?url=https%3A%2F%2Fexample.org%2F&rule=%7C%7Cexample.org%5E%24document');
    });

    test('document filter service adds pages to trusted', () => {
        const url = 'https://example.org/';
        const ruleText = '||example.org^$document';
        documentFilterService.addToTrusted(url);
        const blockingUrl = documentFilterService.getDocumentBlockPageUrl(url, ruleText);
        expect(blockingUrl).toBe(null);
    });
});
