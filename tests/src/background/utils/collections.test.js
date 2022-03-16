import { utils } from '../../../../Extension/src/background/utils/common';

describe('collections', () => {
    it('removes collection elements by predicate', () => {
        const domains = ['www.example.com', 'example.com', 'example.org', 'www.example.org'];
        const domain = 'example.com';
        utils.collections.removeBy(domains, (collectionDomain) => {
            return collectionDomain === domain || utils.url.getCroppedDomainName(collectionDomain) === domain;
        });

        expect(domains).toEqual(['example.org', 'www.example.org']);
    });
});
