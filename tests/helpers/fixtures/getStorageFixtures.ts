/* eslint-disable max-len */
import zod from 'zod';
import SuperJSON from 'superjson';

import { pageStatsValidator } from '../../../Extension/src/background/schema/page-stats';

export const RAW_FILTER_KEY_PREFIX = 'raw_filterrules_';
export const FILTER_KEY_PREFIX = 'filterrules_';
export const BINARY_FILTER_KEY_PREFIX = 'binaryfilterrules_';
export const CONVERSION_MAP_PREFIX = 'conversionmap_';
export const SOURCE_MAP_PREFIX = 'sourcemap_';

export type StorageData = Record<string, unknown>;

export const getStorageFixturesV0 = (): StorageData[] => ([{
    'adguard-settings': {
        'allowlist-enabled': 'true',
        'app-version': '4.1.53',
        'appearance-theme': '"system"',
        'block-list-domains': '[]',
        'client-id': '5HR7pkwP78401460',
        'context-menu-disabled': 'false',
        'custom_filters': '[]',
        'default-whitelist-mode': 'true',
        'detect-filters-disabled': 'false',
        'disable-show-page-statistic': 'false',
        'filters-i18n-metadata': '{"groups":{"2":{"en":{"name":"Privacy"},"es":{"name":"Privacidad"}}},"tags":{"1":{"en":{"description":"Designed to block ads online","name":"Ad Blocking"}}},"filters":{"2":{"en":{"name":"AdGuard Base filter","description":"EasyList + AdGuard Base filter. This filter is necessary for quality ad blocking."},"es":{"name":"Filtro base","description":"EasyList + Filtro base. Este filtro es necesario para el bloqueo de anuncios de calidad."}}}}',
        'filters-metadata': '{"groups":[{"groupId":1,"groupName":"Ad Blocking","displayNumber":1},{"groupId":2,"groupName":"Privacy","displayNumber":2},{"groupId":3,"groupName":"Social Widgets","displayNumber":3},{"groupId":4,"groupName":"Annoyances","displayNumber":4},{"groupId":5,"groupName":"Security","displayNumber":5},{"groupId":6,"groupName":"Other","displayNumber":6},{"groupId":7,"groupName":"Language-specific","displayNumber":7}],"tags":[{"tagId":1,"keyword":"purpose:ads"},{"tagId":2,"keyword":"purpose:privacy"},{"tagId":9,"keyword":"reference:101"},{"tagId":10,"keyword":"recommended"},{"tagId":11,"keyword":"reference:2"}],"filters":[{"filterId":2,"name":"AdGuard Base filter","description":"EasyList + AdGuard English filter. This filter is necessary for quality ad blocking.","timeAdded":"2014-06-30T07:56:55+0000","homepage":"https://adguard.com/kb/general/ad-filtering/adguard-filters/","expires":345600,"displayNumber":1,"groupId":1,"subscriptionUrl":"https://filters.adtidy.org/extension/chromium/filters/2.txt","trustLevel":"full","version":"2.2.77.14","timeUpdated":"2023-04-17T09:31:37+0000","languages":[],"tags":[10,1,9,11]},{"filterId":3,"name":"AdGuard Tracking Protection filter","description":"The most comprehensive list of various online counters and web analytics tools. Use this filter if you do not want your actions on the Internet to be tracked.","timeAdded":"2014-06-30T07:56:55+0000","homepage":"https://adguard.com/kb/general/ad-filtering/adguard-filters/","expires":345600,"displayNumber":1,"groupId":2,"subscriptionUrl":"https://filters.adtidy.org/extension/chromium/filters/3.txt","trustLevel":"full","version":"2.0.54.30","timeUpdated":"2023-04-17T07:31:44+0000","languages":[],"tags":[2,10]}]}',
        'filters-state': '{"1":{"loaded":true,"enabled":true,"installed":true},"2":{"loaded":true,"enabled":true,"installed":true},"3":{"loaded":true,"enabled":false,"installed":true},"4":{"loaded":true,"enabled":false,"installed":true},"6":{"loaded":true,"enabled":true,"installed":true},"10":{"loaded":true,"enabled":true,"installed":true},"11":{"loaded":true,"enabled":false,"installed":true},"14":{"loaded":true,"enabled":false,"installed":true},"16":{"loaded":true,"enabled":true,"installed":true},"17":{"loaded":true,"enabled":false,"installed":true},"18":{"loaded":true,"enabled":false,"installed":true},"19":{"loaded":true,"enabled":false,"installed":true},"20":{"loaded":true,"enabled":false,"installed":true},"21":{"loaded":true,"enabled":false,"installed":true},"22":{"loaded":true,"enabled":false,"installed":true},"224":{"loaded":true,"enabled":true,"installed":true},"1000":{"loaded":true,"enabled":false,"installed":false},"1001":{"loaded":true,"enabled":false,"installed":false},"1002":{"loaded":true,"enabled":false,"installed":false}}',
        'filters-update-period': '-1',
        'filters-version': '{"1":{"version":"2.0.80.9","lastCheckTime":1681726807730,"lastUpdateTime":1681723862000,"expires":345600},"2":{"version":"2.2.77.14","lastCheckTime":1681726807904,"lastUpdateTime":1681723897000,"expires":345600},"3":{"version":"2.0.54.30","lastCheckTime":1681726651464,"lastUpdateTime":1681716704000,"expires":345600},"4":{"version":"2.0.74.96","lastCheckTime":1681726652076,"lastUpdateTime":1681722219000,"expires":345600},"6":{"version":"2.0.33.87","lastCheckTime":1681726807931,"lastUpdateTime":1681723923000,"expires":345600},"10":{"version":"2.0.2.0","lastCheckTime":1681726807685,"lastUpdateTime":1680526919000,"expires":345600},"11":{"version":"2.0.39.20","lastCheckTime":1681726652220,"lastUpdateTime":1681716620000,"expires":345600},"14":{"version":"2.1.56.19","lastCheckTime":1681726650953,"lastUpdateTime":1681723837000,"expires":345600},"16":{"version":"2.0.38.36","lastCheckTime":1681726807955,"lastUpdateTime":1681716647000,"expires":345600},"17":{"version":"2.0.4.66","lastCheckTime":1681726651026,"lastUpdateTime":1681547448000,"expires":345600},"18":{"version":"2.0.4.99","lastCheckTime":1681479087413,"lastUpdateTime":1681461047000,"expires":345600},"19":{"version":"2.0.4.92","lastCheckTime":1681479087467,"lastUpdateTime":1681477381000,"expires":345600},"20":{"version":"2.0.2.37","lastCheckTime":1681479087497,"lastUpdateTime":1681461063000,"expires":345600},"21":{"version":"2.0.3.57","lastCheckTime":1681479087580,"lastUpdateTime":1681477398000,"expires":345600},"22":{"version":"2.0.1.53","lastCheckTime":1681479087607,"lastUpdateTime":1681381875000,"expires":345600},"224":{"version":"2.0.85.48","lastCheckTime":1681726807802,"lastUpdateTime":1681713072000,"expires":345600},"1000":{"version":"","lastCheckTime":1681726650110,"expires":0},"1001":{"version":"","lastCheckTime":1681726650325,"expires":0},"1002":{"version":"","lastCheckTime":1681726650548,"expires":0}}',
        'groups-state': '{"0":{},"1":{"enabled":true},"2":{},"3":{},"4":{},"5":{},"6":{"enabled":true},"7":{"enabled":true}}',
        'hide-rate-block': 'false',
        'hits-count-disabled': 'true',
        'page-statistic': '{"totalBlocked":80,"data":{"hours":[{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"0":10,"1":10,"2":10,"3":10,"4":10,"5":10,"6":10,"7":10,"total":80}],"days":[{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"0":10,"1":10,"2":10,"3":10,"4":10,"5":10,"6":10,"7":10,"total":80}],"months":[{"total":0},{"total":0},{"0":10,"1":10,"2":10,"3":10,"4":10,"5":10,"6":10,"7":10,"total":80}],"updated":1724245200643}}',
        'safebrowsing-disabled': 'true',
        'sb-lru-cache': '[{"key":"7D5B0B1D213AEB4109A9EC26DA13B9F2F2C9D4DD5DDFE99891859940AB3E2C5F","value":"adguard-malware-shavar"}]',
        'show-app-updated-disabled': 'false',
        'show-info-about-adguard-disabled': 'false',
        'stealth-block-first-party-cookies': 'false',
        'stealth-block-first-party-cookies-time': '4320',
        'stealth-block-third-party-cookies': 'true',
        'stealth-block-third-party-cookies-time': '2880',
        'stealth-block-webrtc': 'false',
        'stealth-hide-referrer': 'true',
        'stealth-hide-search-queries': 'true',
        'stealth-remove-x-client': 'true',
        'stealth-send-do-not-track': 'true',
        'stealth_disable_stealth_mode': 'true',
        'use-optimized-filters': 'false',
        'user-filter-enabled': 'true',
        'user-rules-editor-wrap': 'false',
        'viewed-notification-time': 123456789,
        'white-list-domains': '[]',
    },
    'filterrules_0.txt': [],
    'filterrules_1.txt': '',
    'filterrules_2.txt': '',
    'filterrules_4.txt': '',
    'filterrules_6.txt': '',
    'filterrules_10.txt': '',
    'filterrules_16.txt': '',
    'filterrules_18.txt': '',
    'filterrules_19.txt': '',
    'filterrules_20.txt': '',
    'filterrules_21.txt': '',
    'filterrules_22.txt': '',
    'filterrules_224.txt': '',
}, {
    'adguard-settings': {
        'allowlist-enabled': 'true',
        'app-version': '4.1.53',
        'appearance-theme': '"dark"',
        'block-list-domains': '["domain3.com","domain4.com"]',
        'client-id': '5HR7pkwP78401460',
        'context-menu-disabled': 'false',
        'custom_filters': '[{"filterId":1000,"groupId":0,"name":"Rules for CSS tests","description":"","homepage":"","version":"","timeUpdated":"","displayNumber":0,"languages":[],"expires":0,"subscriptionUrl":"https://testcases.agrd.dev/Filters/css-rules/css-rules.txt","tags":[0],"customUrl":"https://testcases.agrd.dev/Filters/css-rules/css-rules.txt","checksum":"cbc44d07ad2c99e86da8812d98191a71","lastCheckTime":1681726650110,"loaded":true,"enabled":false,"languages":["en","fr"]},{"filterId":1001,"groupId":0,"name":"Rules for generic hide tests","description":"","homepage":"","version":"","timeUpdated":1681726650516,"displayNumber":0,"languages":[],"expires":0,"subscriptionUrl":"https://testcases.agrd.dev/Filters/generichide-rules/generichide-rules.txt","tags":[0],"customUrl":"https://testcases.agrd.dev/Filters/generichide-rules/generichide-rules.txt","trusted":true,"checksum":"a6598ac1f44136590b256e61f6603352","lastCheckTime":1681726652480,"enabled":true,"installed":true,"loaded":true,"tagsDetails":[]},{"filterId":1002,"groupId":0,"name":"Rules for element hiding rules test","description":"","homepage":"","version":"","timeUpdated":"","displayNumber":0,"languages":[],"expires":0,"subscriptionUrl":"https://testcases.agrd.dev/Filters/element-hiding-rules/test-element-hiding-rules.txt","tags":[0],"customUrl":"https://testcases.agrd.dev/Filters/element-hiding-rules/test-element-hiding-rules.txt","checksum":"b0fa216cdf8d5eedc444fa11042b7d07","lastCheckTime":1681726652486,"loaded":true,"enabled":true,"installed":true,"tagsDetails":[]}]',
        'default-whitelist-mode': 'false',
        'detect-filters-disabled': 'false',
        'disable-show-page-statistic': 'false',
        'filters-i18n-metadata': '{"groups":{"2":{"en":{"name":"Privacy"},"es":{"name":"Privacidad"}}},"tags":{"1":{"en":{"description":"Designed to block ads online","name":"Ad Blocking"}}},"filters":{"2":{"en":{"name":"AdGuard Base filter","description":"EasyList + AdGuard Base filter. This filter is necessary for quality ad blocking."},"es":{"name":"Filtro base","description":"EasyList + Filtro base. Este filtro es necesario para el bloqueo de anuncios de calidad."}}}}',
        'filters-metadata': '{"groups":[{"groupId":1,"groupName":"Ad Blocking","displayNumber":1},{"groupId":2,"groupName":"Privacy","displayNumber":2},{"groupId":3,"groupName":"Social Widgets","displayNumber":3},{"groupId":4,"groupName":"Annoyances","displayNumber":4},{"groupId":5,"groupName":"Security","displayNumber":5},{"groupId":6,"groupName":"Other","displayNumber":6},{"groupId":7,"groupName":"Language-specific","displayNumber":7}],"tags":[{"tagId":1,"keyword":"purpose:ads"},{"tagId":2,"keyword":"purpose:privacy"},{"tagId":9,"keyword":"reference:101"},{"tagId":10,"keyword":"recommended"},{"tagId":11,"keyword":"reference:2"}],"filters":[{"filterId":2,"name":"AdGuard Base filter","description":"EasyList + AdGuard English filter. This filter is necessary for quality ad blocking.","timeAdded":"2014-06-30T07:56:55+0000","homepage":"https://adguard.com/kb/general/ad-filtering/adguard-filters/","expires":345600,"displayNumber":1,"groupId":1,"subscriptionUrl":"https://filters.adtidy.org/extension/chromium/filters/2.txt","trustLevel":"full","version":"2.2.77.14","timeUpdated":"2023-04-17T09:31:37+0000","languages":[],"tags":[10,1,9,11]},{"filterId":3,"name":"AdGuard Tracking Protection filter","description":"The most comprehensive list of various online counters and web analytics tools. Use this filter if you do not want your actions on the Internet to be tracked.","timeAdded":"2014-06-30T07:56:55+0000","homepage":"https://adguard.com/kb/general/ad-filtering/adguard-filters/","expires":345600,"displayNumber":1,"groupId":2,"subscriptionUrl":"https://filters.adtidy.org/extension/chromium/filters/3.txt","trustLevel":"full","version":"2.0.54.30","timeUpdated":"2023-04-17T07:31:44+0000","languages":[],"tags":[2,10]}]}',
        'filters-state': '{"1":{"loaded":true,"enabled":true,"installed":true},"2":{"loaded":true,"enabled":true,"installed":true},"3":{"loaded":true,"enabled":true,"installed":true},"4":{"loaded":true,"enabled":true,"installed":true},"6":{"loaded":true,"enabled":true,"installed":true},"10":{"loaded":true,"enabled":false,"installed":true},"11":{"loaded":true,"enabled":true,"installed":true},"14":{"loaded":true,"enabled":true,"installed":true},"16":{"loaded":true,"enabled":true,"installed":true},"17":{"loaded":true,"enabled":true,"installed":true},"18":{"loaded":true,"enabled":false,"installed":true},"19":{"loaded":true,"enabled":false,"installed":true},"20":{"loaded":true,"enabled":false,"installed":true},"21":{"loaded":true,"enabled":false,"installed":true},"22":{"loaded":true,"enabled":false,"installed":true},"224":{"loaded":true,"enabled":true,"installed":true},"1000":{"loaded":true,"enabled":false},"1001":{"loaded":true,"enabled":true,"installed":true},"1002":{"loaded":true,"enabled":true,"installed":true}}',
        'filters-update-period': '86400000',
        'filters-version': '{"1":{"version":"2.0.80.9","lastCheckTime":1681726651058,"lastUpdateTime":1681723862000,"expires":345600},"2":{"version":"2.2.77.14","lastCheckTime":1681726651282,"lastUpdateTime":1681723897000,"expires":345600},"3":{"version":"2.0.54.30","lastCheckTime":1681726651464,"lastUpdateTime":1681716704000,"expires":345600},"4":{"version":"2.0.74.96","lastCheckTime":1681726652076,"lastUpdateTime":1681722219000,"expires":345600},"6":{"version":"2.0.33.87","lastCheckTime":1681726652120,"lastUpdateTime":1681723923000,"expires":345600},"10":{"version":"2.0.2.0","lastCheckTime":1681725369349,"lastUpdateTime":1680526919000,"expires":345600},"11":{"version":"2.0.39.20","lastCheckTime":1681726652220,"lastUpdateTime":1681716620000,"expires":345600},"14":{"version":"2.1.56.19","lastCheckTime":1681726650953,"lastUpdateTime":1681723837000,"expires":345600},"16":{"version":"2.0.38.36","lastCheckTime":1681726651004,"lastUpdateTime":1681716647000,"expires":345600},"17":{"version":"2.0.4.66","lastCheckTime":1681726651026,"lastUpdateTime":1681547448000,"expires":345600},"18":{"version":"2.0.4.99","lastCheckTime":1681479087413,"lastUpdateTime":1681461047000,"expires":345600},"19":{"version":"2.0.4.92","lastCheckTime":1681479087467,"lastUpdateTime":1681477381000,"expires":345600},"20":{"version":"2.0.2.37","lastCheckTime":1681479087497,"lastUpdateTime":1681461063000,"expires":345600},"21":{"version":"2.0.3.57","lastCheckTime":1681479087580,"lastUpdateTime":1681477398000,"expires":345600},"22":{"version":"2.0.1.53","lastCheckTime":1681479087607,"lastUpdateTime":1681381875000,"expires":345600},"224":{"version":"2.0.85.48","lastCheckTime":1681726651145,"lastUpdateTime":1681713072000,"expires":345600},"1000":{"version":"","lastCheckTime":1681726650110,"expires":0},"1001":{"version":"","lastCheckTime":1681726650325,"expires":0},"1002":{"version":"","lastCheckTime":1681726650548,"expires":0}}',
        'groups-state': '{"0":{"enabled":true},"1":{"enabled":true},"2":{"enabled":true},"3":{"enabled":true},"4":{"enabled":true},"5":{"enabled":true},"6":{"enabled":true},"7":{"enabled":true}}',
        'hide-rate-block': 'true',
        'hits-count-disabled': 'true',
        'page-statistic': '{"totalBlocked":80,"data":{"hours":[{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"0":10,"1":10,"2":10,"3":10,"4":10,"5":10,"6":10,"7":10,"total":80}],"days":[{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"0":10,"1":10,"2":10,"3":10,"4":10,"5":10,"6":10,"7":10,"total":80}],"months":[{"total":0},{"total":0},{"0":10,"1":10,"2":10,"3":10,"4":10,"5":10,"6":10,"7":10,"total":80}],"updated":1724245200643}}',
        'safebrowsing-disabled': 'false',
        'sb-lru-cache': '[]',
        'show-app-updated-disabled': 'false',
        'show-info-about-adguard-disabled': 'true',
        'stealth-block-first-party-cookies': 'true',
        'stealth-block-first-party-cookies-time': '"4444"',
        'stealth-block-third-party-cookies': 'true',
        'stealth-block-third-party-cookies-time': '1080',
        'stealth-block-webrtc': 'true',
        'stealth-hide-referrer': 'true',
        'stealth-hide-search-queries': 'true',
        'stealth-remove-x-client': 'true',
        'stealth-send-do-not-track': 'true',
        'stealth_disable_stealth_mode': 'false',
        'use-optimized-filters': 'true',
        'user-filter-enabled': 'true',
        'user-rules-editor-wrap': 'false',
        'viewed-notification-time': 123456789,
        'white-list-domains': '["domain1.com","domain2.com"]',
    },
    'filterrules_0.txt': ['||example.com^$document', 'example.org###h1'],
    'filterrules_1.txt': '',
    'filterrules_2.txt': '',
    'filterrules_4.txt': '',
    'filterrules_6.txt': '',
    'filterrules_10.txt': '',
    'filterrules_16.txt': '',
    'filterrules_18.txt': '',
    'filterrules_19.txt': '',
    'filterrules_20.txt': '',
    'filterrules_21.txt': '',
    'filterrules_22.txt': '',
    'filterrules_224.txt': '',
    'filterrules_1000.txt': '',
    'filterrules_1001.txt': '',
    'filterrules_1002.txt': '',
}]);

export const getStorageFixturesV1 = (): StorageData[] => ([{
    'adguard-settings': {
        'adguard-disabled': false,
        'allowlist-domains': '[]',
        'allowlist-enabled': true,
        'appearance-theme': 'system',
        'block-list-domains': '[]',
        'context-menu-disabled': false,
        'custom-filters': '[]',
        'default-allowlist-mode': true,
        'detect-filters-disabled': false,
        'disable-show-page-statistic': false,
        'filters-state': '{"1":{"loaded":true,"enabled":true,"installed":true},"2":{"loaded":true,"enabled":true,"installed":true},"3":{"loaded":true,"enabled":false,"installed":true},"4":{"loaded":true,"enabled":false,"installed":true},"6":{"loaded":true,"enabled":true,"installed":true},"10":{"loaded":true,"enabled":true,"installed":true},"11":{"loaded":true,"enabled":false,"installed":true},"14":{"loaded":true,"enabled":false,"installed":true},"16":{"loaded":true,"enabled":true,"installed":true},"17":{"loaded":true,"enabled":false,"installed":true},"18":{"loaded":true,"enabled":false,"installed":true},"19":{"loaded":true,"enabled":false,"installed":true},"20":{"loaded":true,"enabled":false,"installed":true},"21":{"loaded":true,"enabled":false,"installed":true},"22":{"loaded":true,"enabled":false,"installed":true},"224":{"loaded":true,"enabled":true,"installed":true},"1000":{"loaded":true,"enabled":false,"installed":false},"1001":{"loaded":true,"enabled":false,"installed":false},"1002":{"loaded":true,"enabled":false,"installed":false}}',
        'filters-version': '{"1":{"version":"2.0.80.9","lastCheckTime":1681726807730,"lastUpdateTime":1681723862000,"expires":345600},"2":{"version":"2.2.77.14","lastCheckTime":1681726807904,"lastUpdateTime":1681723897000,"expires":345600},"3":{"version":"2.0.54.30","lastCheckTime":1681726651464,"lastUpdateTime":1681716704000,"expires":345600},"4":{"version":"2.0.74.96","lastCheckTime":1681726652076,"lastUpdateTime":1681722219000,"expires":345600},"6":{"version":"2.0.33.87","lastCheckTime":1681726807931,"lastUpdateTime":1681723923000,"expires":345600},"10":{"version":"2.0.2.0","lastCheckTime":1681726807685,"lastUpdateTime":1680526919000,"expires":345600},"11":{"version":"2.0.39.20","lastCheckTime":1681726652220,"lastUpdateTime":1681716620000,"expires":345600},"14":{"version":"2.1.56.19","lastCheckTime":1681726650953,"lastUpdateTime":1681723837000,"expires":345600},"16":{"version":"2.0.38.36","lastCheckTime":1681726807955,"lastUpdateTime":1681716647000,"expires":345600},"17":{"version":"2.0.4.66","lastCheckTime":1681726651026,"lastUpdateTime":1681547448000,"expires":345600},"18":{"version":"2.0.4.99","lastCheckTime":1681479087413,"lastUpdateTime":1681461047000,"expires":345600},"19":{"version":"2.0.4.92","lastCheckTime":1681479087467,"lastUpdateTime":1681477381000,"expires":345600},"20":{"version":"2.0.2.37","lastCheckTime":1681479087497,"lastUpdateTime":1681461063000,"expires":345600},"21":{"version":"2.0.3.57","lastCheckTime":1681479087580,"lastUpdateTime":1681477398000,"expires":345600},"22":{"version":"2.0.1.53","lastCheckTime":1681479087607,"lastUpdateTime":1681381875000,"expires":345600},"224":{"version":"2.0.85.48","lastCheckTime":1681726807802,"lastUpdateTime":1681713072000,"expires":345600},"1000":{"version":"","lastCheckTime":1681726650110,"lastUpdateTime":0,"expires":0},"1001":{"version":"","lastCheckTime":1681726650325,"lastUpdateTime":0,"expires":0},"1002":{"version":"","lastCheckTime":1681726650548,"lastUpdateTime":0,"expires":0}}',
        'filters-update-period': -1,
        'groups-state': '{"0":{"enabled":false,"touched":false},"1":{"enabled":true,"touched":true},"2":{"enabled":false,"touched":false},"3":{"enabled":false,"touched":false},"4":{"enabled":false,"touched":false},"5":{"enabled":false,"touched":false},"6":{"enabled":true,"touched":true},"7":{"enabled":true,"touched":true}}',
        'hide-rate-block': false,
        'hits-count-disabled': true,
        'safebrowsing-disabled': true,
        'show-app-updated-disabled': false,
        'show-info-about-adguard-disabled': false,
        'stealth-block-first-party-cookies': false,
        'stealth-block-first-party-cookies-time': 4320,
        'stealth-block-third-party-cookies': true,
        'stealth-block-third-party-cookies-time': 2880,
        'stealth-block-webrtc': false,
        'stealth-disable-stealth-mode': true,
        'stealth-hide-referrer': true,
        'stealth-hide-search-queries': true,
        'stealth-remove-x-client': true,
        'stealth-send-do-not-track': true,
        'use-optimized-filters': false,
        'user-filter-enabled': true,
        'user-rules-editor-wrap': false,
    },
    'app-version': '0.0.0',
    'client-id': '5HR7pkwP78401460',
    'filterrules_0.txt': [],
    'filterrules_1.txt': [],
    'filterrules_10.txt': [],
    'filterrules_16.txt': [],
    'filterrules_18.txt': [],
    'filterrules_19.txt': [],
    'filterrules_2.txt': [],
    'filterrules_20.txt': [],
    'filterrules_21.txt': [],
    'filterrules_22.txt': [],
    'filterrules_224.txt': [],
    'filterrules_4.txt': [],
    'filterrules_6.txt': [],
    'sb-lru-cache': '[{"key":"7D5B0B1D213AEB4109A9EC26DA13B9F2F2C9D4DD5DDFE99891859940AB3E2C5F","value":"adguard-malware-shavar"}]',
    'schema-version': 1,
    'viewed-notification-time': 123456789,
    'page-statistic': '{"totalBlocked":80,"data":{"hours":[{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"0":10,"1":10,"2":10,"3":10,"4":10,"5":10,"6":10,"7":10,"total":80}],"days":[{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"0":10,"1":10,"2":10,"3":10,"4":10,"5":10,"6":10,"7":10,"total":80}],"months":[{"total":0},{"total":0},{"0":10,"1":10,"2":10,"3":10,"4":10,"5":10,"6":10,"7":10,"total":80}],"updated":1724245200643}}',
}, {
    'adguard-settings': {
        'adguard-disabled': false,
        'allowlist-domains': '["domain1.com","domain2.com"]',
        'allowlist-enabled': true,
        'appearance-theme': 'dark',
        'block-list-domains': '["domain3.com","domain4.com"]',
        'context-menu-disabled': false,
        'default-allowlist-mode': false,
        'detect-filters-disabled': false,
        'disable-show-page-statistic': false,
        'custom-filters': '[{"timeUpdated":0,"filterId":1000,"groupId":0,"name":"Rules for CSS tests","description":"","homepage":"","version":"","displayNumber":0,"expires":0,"subscriptionUrl":"https://testcases.agrd.dev/Filters/css-rules/css-rules.txt","tags":[0],"customUrl":"https://testcases.agrd.dev/Filters/css-rules/css-rules.txt","checksum":"cbc44d07ad2c99e86da8812d98191a71","lastCheckTime":1681726650110,"loaded":true,"enabled":false,"trusted":false},{"timeUpdated":1681726650516,"filterId":1001,"groupId":0,"name":"Rules for generic hide tests","description":"","homepage":"","version":"","displayNumber":0,"expires":0,"subscriptionUrl":"https://testcases.agrd.dev/Filters/generichide-rules/generichide-rules.txt","tags":[0],"customUrl":"https://testcases.agrd.dev/Filters/generichide-rules/generichide-rules.txt","checksum":"a6598ac1f44136590b256e61f6603352","lastCheckTime":1681726652480,"enabled":true,"installed":true,"loaded":true,"tagsDetails":[],"trusted":true},{"timeUpdated":0,"filterId":1002,"groupId":0,"name":"Rules for element hiding rules test","description":"","homepage":"","version":"","displayNumber":0,"expires":0,"subscriptionUrl":"https://testcases.agrd.dev/Filters/element-hiding-rules/test-element-hiding-rules.txt","tags":[0],"customUrl":"https://testcases.agrd.dev/Filters/element-hiding-rules/test-element-hiding-rules.txt","checksum":"b0fa216cdf8d5eedc444fa11042b7d07","lastCheckTime":1681726652486,"loaded":true,"enabled":true,"installed":true,"tagsDetails":[],"trusted":false}]',
        'filters-state': '{"1":{"loaded":true,"enabled":true,"installed":true},"2":{"loaded":true,"enabled":true,"installed":true},"3":{"loaded":true,"enabled":true,"installed":true},"4":{"loaded":true,"enabled":true,"installed":true},"6":{"loaded":true,"enabled":true,"installed":true},"10":{"loaded":true,"enabled":false,"installed":true},"11":{"loaded":true,"enabled":true,"installed":true},"14":{"loaded":true,"enabled":true,"installed":true},"16":{"loaded":true,"enabled":true,"installed":true},"17":{"loaded":true,"enabled":true,"installed":true},"18":{"loaded":true,"enabled":false,"installed":true},"19":{"loaded":true,"enabled":false,"installed":true},"20":{"loaded":true,"enabled":false,"installed":true},"21":{"loaded":true,"enabled":false,"installed":true},"22":{"loaded":true,"enabled":false,"installed":true},"224":{"loaded":true,"enabled":true,"installed":true},"1000":{"loaded":true,"enabled":false,"installed":false},"1001":{"loaded":true,"enabled":true,"installed":true},"1002":{"loaded":true,"enabled":true,"installed":true}}',
        'filters-version': '{"1":{"version":"2.0.80.9","lastCheckTime":1681726651058,"lastUpdateTime":1681723862000,"expires":345600},"2":{"version":"2.2.77.14","lastCheckTime":1681726651282,"lastUpdateTime":1681723897000,"expires":345600},"3":{"version":"2.0.54.30","lastCheckTime":1681726651464,"lastUpdateTime":1681716704000,"expires":345600},"4":{"version":"2.0.74.96","lastCheckTime":1681726652076,"lastUpdateTime":1681722219000,"expires":345600},"6":{"version":"2.0.33.87","lastCheckTime":1681726652120,"lastUpdateTime":1681723923000,"expires":345600},"10":{"version":"2.0.2.0","lastCheckTime":1681725369349,"lastUpdateTime":1680526919000,"expires":345600},"11":{"version":"2.0.39.20","lastCheckTime":1681726652220,"lastUpdateTime":1681716620000,"expires":345600},"14":{"version":"2.1.56.19","lastCheckTime":1681726650953,"lastUpdateTime":1681723837000,"expires":345600},"16":{"version":"2.0.38.36","lastCheckTime":1681726651004,"lastUpdateTime":1681716647000,"expires":345600},"17":{"version":"2.0.4.66","lastCheckTime":1681726651026,"lastUpdateTime":1681547448000,"expires":345600},"18":{"version":"2.0.4.99","lastCheckTime":1681479087413,"lastUpdateTime":1681461047000,"expires":345600},"19":{"version":"2.0.4.92","lastCheckTime":1681479087467,"lastUpdateTime":1681477381000,"expires":345600},"20":{"version":"2.0.2.37","lastCheckTime":1681479087497,"lastUpdateTime":1681461063000,"expires":345600},"21":{"version":"2.0.3.57","lastCheckTime":1681479087580,"lastUpdateTime":1681477398000,"expires":345600},"22":{"version":"2.0.1.53","lastCheckTime":1681479087607,"lastUpdateTime":1681381875000,"expires":345600},"224":{"version":"2.0.85.48","lastCheckTime":1681726651145,"lastUpdateTime":1681713072000,"expires":345600},"1000":{"version":"","lastCheckTime":1681726650110,"lastUpdateTime":0,"expires":0},"1001":{"version":"","lastCheckTime":1681726650325,"lastUpdateTime":0,"expires":0},"1002":{"version":"","lastCheckTime":1681726650548,"lastUpdateTime":0,"expires":0}}',
        'groups-state': '{"0":{"enabled":true,"touched":true},"1":{"enabled":true,"touched":true},"2":{"enabled":true,"touched":true},"3":{"enabled":true,"touched":true},"4":{"enabled":true,"touched":true},"5":{"enabled":true,"touched":true},"6":{"enabled":true,"touched":true},"7":{"enabled":true,"touched":true}}',
        'filters-update-period': 86400000,
        'hide-rate-block': true,
        'hits-count-disabled': true,
        'safebrowsing-disabled': false,
        'show-app-updated-disabled': false,
        'show-info-about-adguard-disabled': true,
        'stealth-block-first-party-cookies': true,
        'stealth-block-first-party-cookies-time': 4444,
        'stealth-block-third-party-cookies': true,
        'stealth-block-third-party-cookies-time': 1080,
        'stealth-block-webrtc': true,
        'stealth-disable-stealth-mode': false,
        'stealth-hide-referrer': true,
        'stealth-hide-search-queries': true,
        'stealth-remove-x-client': true,
        'stealth-send-do-not-track': true,
        'use-optimized-filters': true,
        'user-filter-enabled': true,
        'user-rules-editor-wrap': false,
    },
    'app-version': '0.0.0',
    'client-id': '5HR7pkwP78401460',
    'filterrules_0.txt': ['||example.com^$document', 'example.org###h1'],
    'filterrules_1.txt': [],
    'filterrules_2.txt': [],
    'filterrules_4.txt': [],
    'filterrules_6.txt': [],
    'filterrules_10.txt': [],
    'filterrules_16.txt': [],
    'filterrules_18.txt': [],
    'filterrules_19.txt': [],
    'filterrules_20.txt': [],
    'filterrules_21.txt': [],
    'filterrules_22.txt': [],
    'filterrules_224.txt': [],
    'filterrules_1000.txt': [],
    'filterrules_1001.txt': [],
    'filterrules_1002.txt': [],
    'sb-lru-cache': '[]',
    'schema-version': 1,
    'page-statistic': '{"totalBlocked":80,"data":{"hours":[{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"0":10,"1":10,"2":10,"3":10,"4":10,"5":10,"6":10,"7":10,"total":80}],"days":[{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"total":0},{"0":10,"1":10,"2":10,"3":10,"4":10,"5":10,"6":10,"7":10,"total":80}],"months":[{"total":0},{"total":0},{"0":10,"1":10,"2":10,"3":10,"4":10,"5":10,"6":10,"7":10,"total":80}],"updated":1724245200643}}',
    'viewed-notification-time': 123456789,
}]);

type SafebrowsingCacheDataV1 = { key: string, value: string };

export const getStorageFixturesV2 = (expires: number): StorageData[] => {
    const storageSettingsFixturesV1 = getStorageFixturesV1();

    return storageSettingsFixturesV1.map((storageSettings) => {
        const sbCacheString = storageSettings['sb-lru-cache'];

        if (typeof sbCacheString !== 'string') {
            throw Error('invalid sbCache type');
        }

        const sbCache: SafebrowsingCacheDataV1[] = JSON.parse(sbCacheString);

        return {
            ...storageSettings,
            'sb-lru-cache': JSON.stringify(sbCache.map(({ key, value }) => ({
                key,
                value: {
                    list: value,
                    expires,
                },
            }))),
            'schema-version': 2,
        };
    });
};

export const getStorageFixturesV3 = (expires: number): StorageData[] => {
    const storageSettingsFixturesV2 = getStorageFixturesV2(expires);

    return storageSettingsFixturesV2.map((storageSettings) => {
        return {
            ...storageSettings,
            'schema-version': 3,
        };
    });
};

export const getStorageFixturesV4 = (expires: number): StorageData[] => {
    const storageSettingsFixturesV3 = getStorageFixturesV3(expires);

    return storageSettingsFixturesV3.map((storageSettings) => {
        // Get keys that starts with 'filterrules_'
        const filterRelatedKeys = Object.keys(storageSettings).filter((key) => key.startsWith(FILTER_KEY_PREFIX));

        // Pick all non-filter keys
        const result = Object.fromEntries(
            Object.entries(storageSettings).filter(([key]) => !filterRelatedKeys.includes(key)),
        );

        // Add lastScheduledCheckTime to filters-version entries based on lastCheckTime
        const adgSettings = result['adguard-settings'] as any;
        const rawFiltersVersion = adgSettings['filters-version'];
        const filtersVersion = JSON.parse(rawFiltersVersion);
        Object.values(filtersVersion).forEach((filterData: any) => {
            filterData.lastScheduledCheckTime = filterData.lastCheckTime;
        });
        adgSettings['filters-version'] = JSON.stringify(filtersVersion);

        result['schema-version'] = 4;

        return result;
    });
};

export const getStorageFixturesV5 = (expires: number): StorageData[] => {
    const storageSettingsFixturesV4 = getStorageFixturesV4(expires);

    return storageSettingsFixturesV4.map((settings) => {
        const adgSettings = settings['adguard-settings'] as Record<string, unknown>;

        // Parse with zod to sort fields
        const filtersState = zod.record(
            zod.string(),
            zod.object({
                enabled: zod.boolean(),
                installed: zod.boolean(),
                loaded: zod.boolean(),
            }),
        ).parse(JSON.parse(adgSettings['filters-state'] as string));

        const groupsState = JSON.parse(adgSettings['groups-state'] as string);

        const isAnnoyancesFilterEnabled = filtersState['14']?.enabled ?? false;

        delete filtersState['14'];

        groupsState['4'] = {
            enabled: isAnnoyancesFilterEnabled,
            touched: !!groupsState['4']?.touched,
        };

        Object.assign(
            filtersState,
            Object.fromEntries(
                ['18', '19', '20', '21', '22'].map((id) => [id, {
                    enabled: isAnnoyancesFilterEnabled,
                    installed: !!filtersState[id]?.installed,
                    loaded: !!filtersState[id]?.loaded,
                }]),
            ),
        );

        adgSettings['filters-state'] = JSON.stringify(filtersState);
        adgSettings['groups-state'] = JSON.stringify(groupsState);

        settings['adguard-settings'] = adgSettings;
        settings['rules-limits'] = JSON.stringify([]);
        settings['schema-version'] = 5;

        return settings;
    });
};

export const getStorageFixturesV6 = (expires: number): StorageData[] => {
    const storageSettingsFixturesV5 = getStorageFixturesV5(expires);

    return storageSettingsFixturesV5.map((settings) => {
        let oldPageStatisticsStr = settings['page-statistic'] as string;

        if (oldPageStatisticsStr.startsWith('"') && oldPageStatisticsStr.endsWith('"')) {
            // beautify the string before parsing
            oldPageStatisticsStr = oldPageStatisticsStr.slice(1, -1);
        }

        const oldPageStatistics = pageStatsValidator.parse(JSON.parse(oldPageStatisticsStr));

        /**
         * Represents a single data item with no specific group or category stats.
         */
        const NO_DATA = {
            total: 0,
        };

        /**
         * Generates an array of empty {@link NO_DATA} items.
         *
         * @param length Array length.
         * @returns Array of empty {@link NO_DATA} items.
         */
        const generateEmptyData = (length: number) => Array.from({ length }, () => NO_DATA);

        /**
         * Expected result of the new data after migration of such old data:
         * `{"0":10,"1":10,"2":10,"3":10,"4":10,"5":10,"6":10,"7":10,"total":80}`.
         */
        const NEW_DATA_OBJ = {
            Advertising: 60,
            Trackers: 10,
            SocialMedia: 10,
            // there is no mapped old group id for 'Cdn' category so no data for it,
            // and all group ids are known so no 'Other' category here as well
            total: 80,
        };

        const newPageStatistics = {
            totalBlocked: oldPageStatistics.totalBlocked,
            data: {
                // 24 hours
                hours: [
                    ...generateEmptyData(23),
                    NEW_DATA_OBJ,
                ],
                // 30 days
                days: [
                    ...generateEmptyData(29),
                    NEW_DATA_OBJ,
                ],
                // only last 3 months
                months: [
                    ...generateEmptyData(2),
                    NEW_DATA_OBJ,
                ],
                updated: oldPageStatistics.data?.updated,
            },
        };

        settings['page-statistic'] = JSON.stringify(newPageStatistics);
        settings['schema-version'] = 6;

        return settings;
    });
};

export const getStorageFixturesV7 = (expires: number): StorageData[] => {
    const storageSettingsFixturesV6 = getStorageFixturesV6(expires);

    return storageSettingsFixturesV6.map((settings) => {
        // For MV2 we don't need to change anything.
        if (!__IS_MV3__) {
            settings['schema-version'] = 7;

            return settings;
        }

        const adgSettings = settings['adguard-settings'] as any;
        const filtersStateData = adgSettings['filters-state'];

        if (typeof filtersStateData !== 'string') {
            throw new Error('Cannot read filters state data');
        }

        const filtersState = zod.record(
            zod.string(),
            zod.object({
                enabled: zod.boolean(),
                installed: zod.boolean(),
                loaded: zod.boolean(),
            }),
        ).parse(JSON.parse(filtersStateData));

        // Added AdGuard Quick Fixes filter which should be enabled by default.
        const addedAdGuardQuickFixesFilterId = 24;
        filtersState[addedAdGuardQuickFixesFilterId] = {
            // Enabled by default.
            enabled: true,
            // Marked as not installed to not remove it as obsoleted
            // (because after migration it would not have info in metadata).
            installed: false,
            // Marked as loaded to update it.
            loaded: true,
        };

        adgSettings['filters-state'] = JSON.stringify(filtersState);
        settings['adguard-settings'] = adgSettings;
        settings['raw_filterrules_24.txt'] = '';
        settings['schema-version'] = 7;

        return settings;
    });
};

export const getStorageFixturesV8 = (expires: number): StorageData[] => {
    const storageSettingsFixturesV7 = getStorageFixturesV7(expires);

    return storageSettingsFixturesV7.map((settings) => {
        // For MV2 we need to change schema version only.
        if (!__IS_MV3__) {
            settings['schema-version'] = 8;
            return settings;
        }

        settings = removeQuickFixesFilter(settings);

        settings['schema-version'] = 8;

        return settings;
    });
};

export const getStorageFixturesV9 = (expires: number): StorageData[] => {
    const storageSettingsFixturesV8 = getStorageFixturesV8(expires);

    return storageSettingsFixturesV8.map((settings) => {
        // For MV2 we need to change schema version only.
        if (!__IS_MV3__) {
            settings['schema-version'] = 9;
            return settings;
        }

        const adgSettings = settings['adguard-settings'] as any;
        const filtersStateData = adgSettings['filters-state'];

        if (typeof filtersStateData !== 'string') {
            throw new Error('Cannot read filters state data');
        }

        const filtersState = zod.record(
            zod.string(),
            zod.object({
                enabled: zod.boolean(),
                installed: zod.boolean(),
                loaded: zod.boolean(),
            }),
        ).parse(JSON.parse(filtersStateData));

        // Added AdGuard Quick Fixes filter which should be enabled by default.
        const addedAdGuardQuickFixesFilterId = 24;
        filtersState[addedAdGuardQuickFixesFilterId] = {
            // Enabled by default.
            enabled: true,
            // Marked as not installed to not remove it as obsoleted
            // (because after migration it would not have info in metadata).
            installed: false,
            // Marked as loaded to update it.
            loaded: true,
        };

        adgSettings['filters-state'] = JSON.stringify(filtersState);
        settings['adguard-settings'] = adgSettings;
        settings['raw_filterrules_24.txt'] = '';
        settings['schema-version'] = 9;

        return settings;
    });
};

export const getStorageFixturesV10 = (expires: number): StorageData[] => {
    const storageSettingsFixturesV9 = getStorageFixturesV9(expires);

    return storageSettingsFixturesV9.map((settings) => {
        // For MV2 we need to change schema version only.
        if (!__IS_MV3__) {
            settings['schema-version'] = 10;
            return settings;
        }

        settings = removeQuickFixesFilter(settings);

        settings['schema-version'] = 10;

        return settings;
    });
};

const removeQuickFixesFilter = (settings: StorageData): StorageData => {
    const adgSettings = settings['adguard-settings'] as any;
    const filtersStateData = adgSettings['filters-state'];

    if (typeof filtersStateData !== 'string') {
        throw new Error('Cannot read filters state data');
    }

    const filtersState = zod.record(
        zod.string(),
        zod.object({
            enabled: zod.boolean(),
            installed: zod.boolean(),
            loaded: zod.boolean(),
        }),
    ).parse(JSON.parse(filtersStateData));

    // Quick fixes filter was disabled in MV3 to comply with CWR policies.
    // TODO: remove code totally later.

    // Deprecated AdGuard Quick Fixes filter which should be removed.
    const deprecatedAdGuardQuickFixesFilterId = 24;
    delete filtersState[deprecatedAdGuardQuickFixesFilterId];

    adgSettings['filters-state'] = JSON.stringify(filtersState);
    settings['adguard-settings'] = adgSettings;
    delete settings['raw_filterrules_24.txt'];

    return settings;
};

export const getStorageFixturesV11 = (expires: number): StorageData[] => {
    const storageSettingsFixturesV10 = getStorageFixturesV10(expires);

    return storageSettingsFixturesV10.map((settings) => {
        const keys = Object.keys(settings).filter((key) => [
            RAW_FILTER_KEY_PREFIX,
            BINARY_FILTER_KEY_PREFIX,
            FILTER_KEY_PREFIX,
            CONVERSION_MAP_PREFIX,
            SOURCE_MAP_PREFIX,
        ].some((prefix) => key.startsWith(prefix)));

        keys.forEach((key) => {
            settings[key] = SuperJSON.serialize(settings[key]);
        });

        settings['schema-version'] = 11;

        return settings;
    });
};
