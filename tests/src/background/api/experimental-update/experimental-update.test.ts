import {
    Experimental,
} from '../../../../../Extension/src/background/services/experimental-update/experimental-update-service-mv3';
import { defaultSettings } from '../../../../../Extension/src/common/settings';
import { SettingOption } from '../../../../../Extension/src/background/schema';
import { getMetadataFixture } from '../../../../helpers';

describe('experimental update', () => {
    const metadata = getMetadataFixture();

    if (!__IS_MV3__) {
        it('SKIP FOR MV2', () => { expect(true).toBe(true); });
        return;
    }

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
                        // Ad Blocking.
                        1: {
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

        it('include AdGuard Annoyances filter parts if it was enabled', () => {
            expect(Experimental.getFiltersSettings([{
                'description': 'Remove pop-ups and floating elements',
                'enabled': true,
                'groupId': 3,
                'iconId': 'ANNOYANCES',
                'id': 14,
                'title': 'Block annoyances',
            }], metadata, []))
                .toEqual({
                    customFiltersState: [],
                    groupsState: {
                        // Annoyances group.
                        4: {
                            enabled: true,
                            touched: true,
                        },
                    },
                    filtersState: {
                        // AdGuard Cookie Notices.
                        18: { enabled: true, installed: false, loaded: false },
                        // AdGuard Popups.
                        19: { enabled: true, installed: false, loaded: false },
                        // AdGuard Mobile App Banners.
                        20: { enabled: true, installed: false, loaded: false },
                        // AdGuard Other Annoyances.
                        21: { enabled: true, installed: false, loaded: false },
                        // AdGuard Widgets.
                        22: { enabled: true, installed: false, loaded: false },
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
                        // Custom filters.
                        0: {
                            enabled: true,
                            touched: true,
                        },
                        // Ad Blocking.
                        1: {
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
                            // Note: custom filters always should be true.
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
                        // Ad Blocking.
                        1: {
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
            expect(Experimental.getFiltersSettings([{
                'enabled': true,
                'groupId': 3,
                'iconId': 'AD_BLOCKING',
                'id': 2,
                'title': 'Block ads',
            }, {
                'description': 'Filter that enables ad blocking on websites in the Japanese language.',
                'enabled': true,
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
            }, {
                'id': 'ruleset_7',
                'enabled': false,
                'path': 'filters/declarative/ruleset_7/ruleset_7.json',
            }]))
                .toEqual({
                    customFiltersState: [],
                    groupsState: {
                        // Ad Blocking.
                        1: {
                            enabled: true,
                            touched: true,
                        },
                        // Language-specific.
                        7: {
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
                        7: {
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
