import { findChunks } from '../../../Extension/src/pages/helpers';

describe('helpers', () => {
    describe('findChunks', () => {
        it('chunks count', () => {
            expect(findChunks('AdGuard Base filter', 'base')).toHaveLength(3);
            expect(findChunks('AdGuard Base filter', 'ADG')).toHaveLength(2);
            expect(findChunks('AdGuard Base filter', 'filter')).toHaveLength(2);
            expect(findChunks('Peter Lowe\'s Blocklist', 'lo')).toHaveLength(5);
            expect(findChunks('Fanboy\'s Anti-Facebook List', 'Bo')).toHaveLength(5);
            expect(findChunks('ChinaList+EasyList', '+')).toHaveLength(3);
        });
        it('matches', () => {
            let chunks = findChunks('AdGuard Base filter', 'base');
            let expected = ['AdGuard ', 'Base', ' filter'];
            expect(chunks).toEqual(expected);

            chunks = findChunks('AdGuard Base filter', 'base FIlt');
            expected = ['AdGuard ', 'Base filt', 'er'];
            expect(chunks).toEqual(expected);

            chunks = findChunks('Fanboy\'s Anti-Facebook List', 'Bo');
            expected = ['Fan', 'bo', 'y\'s Anti-Face', 'bo', 'ok List'];
            expect(chunks).toEqual(expected);

            chunks = findChunks('ChinaList+EasyList', '+');
            expected = ['ChinaList', '+', 'EasyList'];
            expect(chunks).toEqual(expected);
        });
    });
});
