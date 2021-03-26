import { matchesSearch } from '../../../../../Extension/src/pages/filtering-log/stores/helpers';

describe('helpers', () => {
    describe('matchesSearch', () => {
        it('matches filtering event by filter name', () => {
            const filteringEvent = {
                filterName: 'AdGuard Base filter',
            };

            expect(matchesSearch(filteringEvent, 'base')).toBeTruthy();
            expect(matchesSearch(filteringEvent, '')).toBeTruthy();
            expect(matchesSearch(filteringEvent, 'basic')).toBeFalsy();
        });
    });
});
