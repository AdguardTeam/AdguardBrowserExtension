import { UrlUtils } from '../../../../../../Extension/src/pages/filtering-log/components/RequestWizard/utils';

describe('utils', () => {
    describe('UrlUtils', () => {
        describe('getProtocol', () => {
            it('returns protocol of url', () => {
                expect(UrlUtils.getProtocol('https://example.org')).toBe('https:');
                expect(UrlUtils.getProtocol('http://example.org')).toBe('http:');
            });

            it('returns protocol of url with stun', () => {
                expect(UrlUtils.getProtocol('stun:example.org')).toBe('stun:');
                expect(UrlUtils.getProtocol('turn:example.org')).toBe('turn:');
            });
        });

        describe('getUrlWithoutScheme', () => {
            it('returns url without scheme for standard protocols https, ws', () => {
                expect(UrlUtils.getUrlWithoutScheme('https://example.org')).toBe('example.org');
                expect(UrlUtils.getUrlWithoutScheme('https://www.example.org')).toBe('example.org');
            });
            it('returns url without scheme for non-standard protocols stun', () => {
                expect(UrlUtils.getUrlWithoutScheme('stun:example.org')).toBe('example.org');
            });
        });
    });
});
