import { I18n } from '../../../../Extension/src/background/utils';

describe('I18n utility', () => {
    describe('finds locale in locales', () => {
        const cases = [
            { locale: 'en', locales: ['en'], expected: 'en' },
            { locale: 'en', locales: { en: 'en' }, expected: 'en' },
            { locale: 'en_US', locales: ['en'], expected: 'en' },
            { locale: 'en_US', locales: { en: 'en' }, expected: 'en' },
            { locale: 'en-US', locales: ['en'], expected: 'en' },
            { locale: 'en-US', locales: { en: 'en' }, expected: 'en' },
            { locale: 'en', locales: ['fr'], expected: null },
            { locale: 'en', locales: { fr: 'fr' }, expected: null },
        ];

        it.each(cases)('returns $expected for locale $locale in locales $locales', ({
            locale,
            locales,
            expected,
        }) => {
            expect(I18n.find(locales, locale)).toBe(expected);
        });
    });
});
