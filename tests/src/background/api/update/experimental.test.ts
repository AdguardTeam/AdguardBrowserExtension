import { Experimental } from '../../../../../Extension/src/background/api/update/experimental';
import { defaultSettings } from '../../../../../Extension/src/common/settings';
import { SettingOption } from '../../../../../Extension/src/background/schema';
import { getMetadataFixture } from '../../../../helpers';

describe('experimental', () => {
    const metadata = getMetadataFixture();

    it('checks if the data is from the experimental extension', () => {
        expect(Experimental.isExperimental(null)).toBe(false);
        expect(Experimental.isExperimental(undefined)).toBe(false);
        expect(Experimental.isExperimental({})).toBe(false);
        expect(Experimental.isExperimental({
            'ENABLED_FILTERS_IDS': [],
        })).toBe(false);
        expect(Experimental.isExperimental({
            'ENABLED_FILTERS_IDS': [],
            'custom_filters_rules': '',
            'user_rules': '',
            'user_rules_status': '',
        })).toBe(true);
    });

    it('retrieves userrules', () => {
        expect(Experimental.getUserRules('')).toEqual([]);
        expect(Experimental.getUserRules('\n@@||x.com^$document\n'))
            .toEqual(['@@||x.com^$document']);
        expect(Experimental.getUserRules('!off!example.org\nexample.com'))
            .toEqual(['!example.org', 'example.com']);
    });

    describe('retrieves filters and groups', () => {
        it('returns empty objects if the data is not provided', () => {
            expect(Experimental.getFiltersSettings(null, metadata, []))
                .toEqual({
                    customFiltersState: [],
                    groupsState: {},
                    filtersState: {},
                });
        });

        it('does not fail if some data is empty or invalid', () => {
            expect(Experimental.getFiltersSettings([{}], metadata, []))
                .toEqual({
                    customFiltersState: [],
                    groupsState: {},
                    filtersState: {},
                });
            expect(Experimental.getFiltersSettings([
                // valid
                {
                    'enabled': true,
                    'groupId': 3,
                    'iconId': 'AD_BLOCKING',
                    'id': 2,
                    'title': 'Block ads',
                },
                // empty
                {},
                // invalid
                {
                    'enabled': true,
                    'iconId': 'AD_BLOCKING',
                    'title': 'Block ads',
                },
            ], metadata, [{
                'id': 'ruleset_2',
                'enabled': false,
                'path': 'filters/declarative/ruleset_2/ruleset_2.json',
            }]))
                .toEqual({
                    customFiltersState: [],
                    groupsState: {
                        2: {
                            enabled: true,
                            touched: true,
                        }, // notice group is 2, not 3
                    },
                    filtersState: {
                        2: {
                            enabled: true,
                            loaded: false,
                            installed: false,
                        },
                    },
                });
        });

        it('gets filters and groups', () => {
            expect(Experimental.getFiltersSettings([
                {
                    'enabled': true,
                    'groupId': 3,
                    'iconId': 'AD_BLOCKING',
                    'id': 2,
                    'title': 'Block ads',
                },
                {
                    'enabled': true,
                    'groupId': 0,
                    'iconId': 'AD_BLOCKING',
                    'id': 1000,
                    'title': 'custom',
                    'url': 'https://custom-url.com',
                },
            ], metadata, [{
                'id': 'ruleset_2',
                'enabled': false,
                'path': 'filters/declarative/ruleset_2/ruleset_2.json',
            }]))
                .toEqual({
                    customFiltersState: [
                        {
                            customUrl: 'https://custom-url.com',
                            trusted: false,
                            timeUpdated: 0,
                            checksum: '',
                            description: '',
                            displayNumber: 0,
                            expires: 0,
                            filterId: 1000,
                            groupId: 0,
                            homepage: '',
                            name: 'custom',
                            tags: [
                                0,
                            ],
                            version: '',
                        },
                    ],
                    groupsState: {
                        // notice groupId is 2 not 3
                        2: {
                            enabled: true,
                            touched: true,
                        },
                        0: {
                            enabled: true,
                            touched: true,
                        },
                    },
                    filtersState: {
                        2: {
                            enabled: true,
                            loaded: false,
                            installed: false,
                        },
                        1000: {
                            enabled: true,
                            installed: false,
                            // notice custom filters always should be true
                            loaded: true,
                        },
                    },
                });
            expect(Experimental.getFiltersSettings([{
                'enabled': true,
                'groupId': 3,
                'iconId': 'AD_BLOCKING',
                'id': 2,
                'title': 'Block ads',
            }, {
                'description': 'Filter that enables ad blocking on websites in the Japanese language.',
                'enabled': false,
                'groupId': 7,
                'id': 7,
                'localeCodes': [
                    'ja',
                    'ja_JP',
                ],
                'title': 'Japanese',
            }], metadata, [{
                'id': 'ruleset_2',
                'enabled': false,
                'path': 'filters/declarative/ruleset_2/ruleset_2.json',
            }]))
                .toEqual({
                    customFiltersState: [],
                    groupsState: {
                        // notice group id is 3, as in the metadata
                        2: {
                            enabled: true,
                            touched: true,
                        },
                    },
                    filtersState: {
                        2: {
                            enabled: true,
                            loaded: false,
                            installed: false,
                        },
                    },
                });
        });
    });

    it('migrates data from the experimental extension to the new mv3 extension', async () => {
        const data = {
            'ENABLED_FILTERS_IDS': [],
            'custom_filters_rules': '',
            'user_rules': '',
            'user_rules_status': '',
        };

        expect(Experimental.migrateSettings(data, metadata, []))
            .toEqual({
                customFilters: [],
                userrules: [],
                settings: {
                    ...defaultSettings,
                    [SettingOption.FiltersState]: '{}',
                    [SettingOption.GroupsState]: '{}',
                    [SettingOption.CustomFilters]: '[]',
                },
            });
    });
});
