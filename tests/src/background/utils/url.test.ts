import { UrlUtils } from '../../../../Extension/src/background/utils';

describe('trimFilterFilepath', () => {
    it('should return unmodified path for urls', () => {
        const path = 'https://filters.adtidy.org/mac_v2/filters/15.txt';
        expect(UrlUtils.trimFilterFilepath(path)).toEqual(path);
    });

    it('should return unmodified path if no slash or backslash found', () => {
        const path = 'filter.txt';
        expect(UrlUtils.trimFilterFilepath(path)).toEqual(path);
    });

    it('should handle file paths with backslashes', () => {
        const path = 'D:\\Workspace\\AdblockFilters\\anti-antiadb.txt';
        const expected = '\\anti-antiadb.txt';
        expect(UrlUtils.trimFilterFilepath(path)).toEqual(expected);
    });

    it('should handle file paths with slashes', () => {
        const path = 'file:///Users/userName/Library/CloudStorage/Adguard/Kelvin\'s Adguard Filter.txt';
        const expected = '/Kelvin\'s Adguard Filter.txt';
        expect(UrlUtils.trimFilterFilepath(path)).toEqual(expected);
    });
});
