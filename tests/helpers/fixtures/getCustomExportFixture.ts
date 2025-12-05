import {
    type Config,
    RootOption,
    PROTOCOL_VERSION,
    GeneralSettingsOption,
    ExtensionSpecificSettingsOption,
    FiltersOption,
    UserFilterOption,
    AllowlistOption,
    StealthOption,
    CustomFilterOption,
} from '../../../Extension/src/background/schema';

import { filterNameFixture } from './filterWithMetadata';

// IMPORTANT: for all these objects with different protocol versions, the custom
// filters urls must be unique in order to properly emulate receiving them from
// the remote url.

// Separate fixture for old versions of protocol.
// The keys here are strings, because in newest versions of the protocol
// the keys may have been renamed.
export const getExportedSettingsProtocolV1Fixture = () => ({
    'protocol-version': '1.0',
    'general-settings': {
        'app-language': 'en-US',
        'allow-acceptable-ads': false,
        'show-blocked-ads-count': false,
        'autodetect-filters': false,
        'safebrowsing-enabled': true,
        'filters-update-period': 3600000,
        'appearance-theme': '\"dark\"',
    },
    'extension-specific-settings': {
        'use-optimized-filters': true,
        'collect-hits-count': true,
        'show-context-menu': true,
        'show-info-about-adguard': false,
        'show-app-updated-info': true,
        'hide-rate-adguard': true,
        'user-rules-editor-wrap': false,
        'allow-anonymized-usage-data': false,
    },
    'filters': {
        'enabled-filters': [1, 2, 3, 4, 7, 13, 17, 18, 19, 20, 21, 22, 241, 1000],
        'enabled-groups': [0, 1, 2, 3, 4, 5, 6, 7],
        'custom-filters': [{
            'customUrl': 'https://testcases.agrd.dev/Filters/element-hiding-rules/test-element-hiding-rules.txt',
            'title': 'Rules for element hiding rules test',
            'trusted': true,
            'enabled': true,
        },
        {
            'customUrl': 'https://testcases.agrd.dev/Filters/generichide-rules/generichide-rules.txt',
        }],
        'user-filter': {
            'enabled': true,
            // eslint-disable-next-line max-len
            'rules': 'example.org##body\n||mail.ru^$first-party\nchampionat.com##.header\n\n\n!\n! Title: Rules for simple rules tests\n! Filter to be used for testing purposes\n! https://testcases.adguard.com\n! Hide warning\ntestcases.adguard.com,surge.sh###subscribe-to-test-simple-rules-filter\n! Test case 1: domain-specific elemhide rule\ntestcases.adguard.com,surge.sh###case-1-elemhide > .test-banner\n! Test case 2: generic elemhide rule\n###case-2-generic-elemhide > .test-banner\n! Test case 3: elemhide rule exception\n###case-3-elemhide-exception > .test-banner\ntestcases.adguard.com,surge.sh#@##case-3-elemhide-exception > .test-banner\n! Test case 3: wildcard exception\ntestcases.adguard.com,surge.sh###case-3-elemhide-exception > h1\n*#@##case-3-elemhide-exception > h1\n! Test case 3: generic exception\ntestcases.adguard.com,surge.sh###case-3-elemhide-exception > h2\n#@##case-3-elemhide-exception > h2\n! Test case 3: generic exception for generic elemhide\n###case-3-elemhide-exception > h3\n#@##case-3-elemhide-exception > h3\n! Test case 4: domain exclusion\n~testcases.adguard.com,~surge.sh###case-4-domain-exclusion > .test-banner\n! Test case 5: wildcard for tld\ntestcases.adguard.*,surge.*###case-5-wildcard-for-tld > .test-banner\n! Test case 6: wildcard for tld support with $domain modifier\n||*/tld-test-files/$image,domain=testcases.adguard.*|surge.*\n||*/tld*$script,domain=testcases.adguard.*|surge.*\n! Test case 6: $third-party modifier\n||antibanner.net^$third-party\n! Title: Rules for extended css rules test\ntestcases.adguard.com,surge.sh###subscribe-to-test-extended-css-rules-filter\ntestcases.adguard.com,surge.sh#?##case1.banner:has(a.banner-link)\ntestcases.adguard.com,surge.sh#?##case2.banner:contains(Click Me!)\ntestcases.adguard.com,surge.sh#?##case3.banner:matches-css(opacity: 0.9)\ntestcases.adguard.com,surge.sh#?##case4.banner:matches-css-after(content: sponsored)\ntestcases.adguard.com,surge.sh#?##case5.banner:matches-css-before(content: sponsored)\ntestcases.adguard.com,surge.sh#?##case6.banner:has-text(You would want to click me for sure!)\ntestcases.adguard.com,surge.sh#?##case7.banner:-abp-has(a.banner-link)\ntestcases.adguard.com,surge.sh#?##case8.banner:contains(Click Me!)\ntestcases.adguard.com,surge.sh#?##case9.banner:contains(/[aа]{20,}/)\ntestcases.adguard.com,surge.sh#?##case10.banner:matches-css(background-image: /url\\(data\\:image\\/svg\\+xml;base64,[A-Za-z0-9]{100,}/)\ntestcases.adguard.com,surge.sh#?##case11.banner:matches-css-after(background-image: /url\\(data\\:image\\/svg\\+xml;base64,[A-Za-z0-9]{100,}/)\ntestcases.adguard.com,surge.sh#?##case12.banner:matches-css-before(background-image: /url\\(data\\:image\\/svg\\+xml;base64,[A-Za-z0-9]{100,}/)\ntestcases.adguard.com,surge.sh#?#body #case13.banner[-ext-has="a.banner-link"]\ntestcases.adguard.com,surge.sh#?#.container > #case14.banner[-ext-contains="/[aа]{20,}/"]\ntestcases.adguard.com,surge.sh#?##case14 + #case15.banner[-ext-matches-css-after="content:sponsored"]\ntestcases.adguard.com,surge.sh#?##case1 ~ #case16.banner[-ext-matches-css-before="content:sponsored"]\ntestcases.adguard.com,surge.sh#?#*:contains(/absolute[\\s\\S]*-\\d{4}/) + * > .banner:contains(/а/) ~ #case17.banner:has(> div:contains(/а/):nth-child(100n + 2))\ntestcases.adguard.com,surge.sh#?#.test-xpath-case18:xpath(//*[@class="test-case18-div"]/../..)\ntestcases.adguard.com,surge.sh#?#.test-nth-ancestor-case19:nth-ancestor(3)\ntestcases.adguard.com,surge.sh#?#.test-upward-selector:upward(#case20)\ntestcases.adguard.com,surge.sh#?#.test-upward-number-case21:upward(4)\n! Case 22\ntestcases.adguard.com,surge.sh#?##inframe1:has(.content)\ntestcases.adguard.com,surge.sh#?##case23 > div:contains(/kick me!|\\(18\\+\\)|https:\\/\\/vk.cc|testTEXT|vk.com\\/test_id/)\ntestcases.adguard.com,surge.sh#?##case24 > div:matches-attr("/^data-.{4}$/"="/banner/")\ntestcases.adguard.com,surge.sh#?##case25 > div:matches-property("id"="/property-match/")\ntestcases.adguard.com,surge.sh#?##case26:remove()\ntestcases.adguard.com,surge.sh#$?##case27:has(div) { remove: true; }\ntestcases.adguard.com,surge.sh#?##case28 > :is(.case28, #main, footer, span):contains(isTest)\n! Title: Rules for $important rules test\ntestcases.adguard.com,surge.sh###subscribe-to-test-important-rules-filter\n! Case 1\n||*/test-files/adg1.png$important\n@@||*/test-files/adg1.png\n! Case 2\n||*/test-files/adg2.png$important\n@@||*/test-files/adg2.png$important\n! Title: Rules for $replace rules test\ntestcases.adguard.com,surge.sh###subscribe-to-test-replace-rules-filter\n! Case 1: text response\n||testcases.adguard.com/*/case1-text-response.txt$replace=/adguard/Test passed/i\n||surge.sh/*/case1-text-response.txt$replace=/adguard/Test passed/i\n! Case 2: response is more then 3MB\n||testcases.adguard.com/*/case2-response-over-3mb.txt$replace=/Adguard/Replaced/i\n||surge.sh/*/case2-response-over-3mb.txt$replace=/Adguard/Replaced/i\n! Case 3: using with other rules (without $replace modifier) for a same request\n||testcases.adguard.com/*/case3-using-with-other-rules.txt$replace=/adguard/Test passed/i\n||surge.sh/*/case3-using-with-other-rules.txt$replace=/adguard/Test passed/i\n||testcases.adguard.com/*/case3-using-with-other-rules.txt\n||surge.sh/*/case3-using-with-other-rules.txt\n! Case 4: multiple $replace rules matching a single request\n||testcases.adguard.com/*/case4-multiple-replace-rules.txt$replace=/adguard/first replace rule work/i\n||surge.sh/*/case4-multiple-replace-rules.txt$replace=/adguard/first replace rule work/i\n||testcases.adguard.com/*/case4-multiple-replace-rules.txt$replace=/team/and second as well/i\n||surge.sh/*/case4-multiple-replace-rules.txt$replace=/team/and second as well/i\n! Case 5: disabling $replace rules\n||testcases.adguard.com/*/case5-disabling-replace-rule.txt$replace=/adguard/first replace rule works/i\n||surge.sh/*/case5-disabling-replace-rule.txt$replace=/adguard/first replace rule works/i\n||testcases.adguard.com/*/case5-disabling-replace-rule.txt$replace=/team/and second as well/i\n||surge.sh/*/case5-disabling-replace-rule.txt$replace=/team/and second as well/i\n@@||testcases.adguard.com/*/case5-disabling-replace-rule.txt$replace\n@@||surge.sh/*/case5-disabling-replace-rule.txt$replace\n! Case 6: multiple $replace rules\n||testcases.adguard.com/*/case6-disabling-multiple-replace-rules.txt$replace=/adguard/first replace rule/i\n||surge.sh/*/case6-disabling-multiple-replace-rules.txt$replace=/adguard/first replace rule/i\n||testcases.adguard.com/*/case6-disabling-multiple-replace-rules.txt$replace=/works/works and second as well/i\n||surge.sh/*/case6-disabling-multiple-replace-rules.txt$replace=/works/works and second as well/i\n@@||testcases.adguard.com/*/case6-disabling-multiple-replace-rules.txt$replace=/works/works and second as well/i\n@@||surge.sh/*/case6-disabling-multiple-replace-rules.txt$replace=/works/works and second as well/i\n! Case 7: using with $script exception modifier for a same request\n||testcases.adguard.com/*/case7-content-type-modifier.js$replace=/tmp\\s+\\=\\s+0/tmp = 1/i\n||surge.sh/*/case7-content-type-modifier.js$replace=/tmp\\s+\\=\\s+0/tmp = 1/i\n||testcases.adguard.com/*/case7-content-type-modifier.js$script\n||surge.sh/*/case7-content-type-modifier.js$script',
            'disabled-rules': '',
        },
        'whitelist': {
            'enabled': true,
            'inverted': false,
            'domains': ['domain1.com', 'domain2.com'],
            'inverted-domains': ['domain3.com', 'domain4.com'],
        },
    },
    'stealth': {
        'stealth_disable_stealth_mode': false,
        'stealth-hide-referrer': true,
        'stealth-hide-search-queries': true,
        'stealth-send-do-not-track': true,
        'stealth-block-webrtc': true,
        'stealth-remove-x-client': true,
        'stealth-block-third-party-cookies': true,
        'stealth-block-third-party-cookies-time': '3333',
        'stealth-block-first-party-cookies': true,
        'stealth-block-first-party-cookies-time': 8888,
        'block-known-trackers': true,
        'strip-tracking-parameters': true,
    },
});

export const getImportedSettingsFromV1Fixture = () => {
    const configV1 = getExportedSettingsProtocolV1Fixture();

    // Set fields according to the latest protocol version
    configV1[RootOption.ProtocolVersion] = PROTOCOL_VERSION;
    // eslint-disable-next-line max-len
    configV1[RootOption.GeneralSettings][GeneralSettingsOption.AppearanceTheme] = JSON.parse(configV1['general-settings']['appearance-theme']);
    // eslint-disable-next-line max-len
    configV1[RootOption.Stealth][StealthOption.SelfDestructThirdPartyCookiesTime] = JSON.parse(configV1['stealth']['stealth-block-third-party-cookies-time']);

    // Fill up optional fields
    configV1[RootOption.Filters][FiltersOption.CustomFilters][1]!.title = filterNameFixture;
    configV1[RootOption.Filters][FiltersOption.CustomFilters][1]!.trusted = false;
    configV1[RootOption.Filters][FiltersOption.CustomFilters][1]!.enabled = false;

    Object.assign(
        configV1[RootOption.Filters],
        {
            ...configV1[RootOption.Filters],
            [FiltersOption.Allowlist]: configV1[RootOption.Filters]['whitelist'],
        },
    );
    // @ts-ignore
    delete configV1[RootOption.Filters]['whitelist'];
    // eslint-disable-next-line max-len
    Object.assign(
        configV1[RootOption.Stealth],
        {
            [StealthOption.DisableStealthMode]: configV1[RootOption.Stealth]['stealth_disable_stealth_mode'],
            ...configV1[RootOption.Stealth],
        },
    );
    // @ts-ignore
    delete configV1[RootOption.Stealth]['stealth_disable_stealth_mode'];

    // @ts-ignore
    delete configV1[RootOption.GeneralSettings][GeneralSettingsOption.AppLanguage];

    if (__IS_MV3__) {
        configV1.filters['enabled-filters'] = configV1.filters['enabled-filters']
            .filter((id) => {
                // 14 - AdGuard Annoyances filter has been splitted into 5 other filters: Cookie Notices, Popups, Mobile
                // App Banners, Other Annoyances and Widgets
                // 15 - AdGuard DNS filter - not supported in MV3.
                // 241 - EasyList Cookie List, author does not support MV3.
                return id !== 14 && id !== 15 && id !== 241;
            });

        // TODO: revert if Quick Fixes filter is back
        // // Insert before last element to correct order in strict equal tests.
        // configV1.filters['enabled-filters'].splice(
        //     configV1.filters['enabled-filters'].length - 1,
        //     0,
        //     // 24 - AdGuard Quick Fixes enabled by default for MV3.
        //     24,
        // );

        // Safebrowsing deleted after 5.0 (MV3).
        configV1['general-settings']['safebrowsing-enabled'] = false;

        // Updating filters in MV3 do not supported.
        configV1['general-settings']['filters-update-period'] = -1;
    }

    return configV1;
};

export const getExportedSettingsProtocolV2Fixture = (): Config => ({
    [RootOption.ProtocolVersion]: PROTOCOL_VERSION,
    [RootOption.GeneralSettings]: {
        [GeneralSettingsOption.AllowAcceptableAds]: false,
        [GeneralSettingsOption.ShowBlockedAdsCount]: false,
        [GeneralSettingsOption.AutodetectFilters]: false,
        [GeneralSettingsOption.SafebrowsingEnabled]: !__IS_MV3__,
        [GeneralSettingsOption.FiltersUpdatePeriod]: __IS_MV3__ ? -1 : 3600000,
        [GeneralSettingsOption.AppearanceTheme]: 'dark',
    },
    [RootOption.ExtensionSpecificSettings]: {
        [ExtensionSpecificSettingsOption.UseOptimizedFilters]: true,
        [ExtensionSpecificSettingsOption.CollectHitsCount]: true,
        [ExtensionSpecificSettingsOption.ShowContextMenu]: true,
        [ExtensionSpecificSettingsOption.ShowInfoAboutAdguard]: false,
        [ExtensionSpecificSettingsOption.ShowAppUpdatedInfo]: true,
        [ExtensionSpecificSettingsOption.HideRateAdguard]: true,
        [ExtensionSpecificSettingsOption.UserRulesEditorWrap]: false,
        [ExtensionSpecificSettingsOption.AllowAnonymizedUsageData]: false,
    },
    [RootOption.Filters]: {
        [FiltersOption.EnabledFilters]: __IS_MV3__
            // 14 - AdGuard Annoyances filter has been splitted into 5 other filters: Cookie Notices, Popups, Mobile
            // App Banners, Other Annoyances and Widgets
            // 15 - AdGuard DNS filter - not supported in MV3.
            // 241 - EasyList Cookie List, author does not support MV3.
            ? [1, 2, 3, 4, 7, 13, 17, 1000, 1001]
            // TODO: revert if Quick Fixes filter is back
            // ? [1, 2, 3, 4, 7, 13, 17, 24, 1000, 1001]
            : [1, 2, 3, 4, 7, 13, 17, 18, 19, 20, 21, 22, 241, 1000, 1001],
        [FiltersOption.EnabledGroups]: [0, 1, 2, 3, 4, 5, 6, 7],
        [FiltersOption.CustomFilters]: [{
            // eslint-disable-next-line max-len
            [CustomFilterOption.CustomUrl]: 'https://testcases.agrd.dev/Filters/element-hiding-rules/test-element-hiding-rules.txt',
            [CustomFilterOption.Title]: 'Rules for element hiding rules test',
            [CustomFilterOption.Trusted]: true,
            [CustomFilterOption.Enabled]: true,
        },
        {
            // eslint-disable-next-line max-len
            [CustomFilterOption.CustomUrl]: 'https://testcases.agrd.dev/Filters/generichide-rules/generichide-rules.txt',
            [CustomFilterOption.Trusted]: true,
            [CustomFilterOption.Enabled]: true,
        }],
        [FiltersOption.UserFilter]: {
            [UserFilterOption.Enabled]: true,
            // eslint-disable-next-line max-len
            [UserFilterOption.Rules]: 'example.org##body\n||mail.ru^$first-party\nchampionat.com##.header\n\n\n!\n! Title: Rules for simple rules tests\n! Filter to be used for testing purposes\n! https://testcases.adguard.com\n! Hide warning\ntestcases.adguard.com,surge.sh###subscribe-to-test-simple-rules-filter\n! Test case 1: domain-specific elemhide rule\ntestcases.adguard.com,surge.sh###case-1-elemhide > .test-banner\n! Test case 2: generic elemhide rule\n###case-2-generic-elemhide > .test-banner\n! Test case 3: elemhide rule exception\n###case-3-elemhide-exception > .test-banner\ntestcases.adguard.com,surge.sh#@##case-3-elemhide-exception > .test-banner\n! Test case 3: wildcard exception\ntestcases.adguard.com,surge.sh###case-3-elemhide-exception > h1\n*#@##case-3-elemhide-exception > h1\n! Test case 3: generic exception\ntestcases.adguard.com,surge.sh###case-3-elemhide-exception > h2\n#@##case-3-elemhide-exception > h2\n! Test case 3: generic exception for generic elemhide\n###case-3-elemhide-exception > h3\n#@##case-3-elemhide-exception > h3\n! Test case 4: domain exclusion\n~testcases.adguard.com,~surge.sh###case-4-domain-exclusion > .test-banner\n! Test case 5: wildcard for tld\ntestcases.adguard.*,surge.*###case-5-wildcard-for-tld > .test-banner\n! Test case 6: wildcard for tld support with $domain modifier\n||*/tld-test-files/$image,domain=testcases.adguard.*|surge.*\n||*/tld*$script,domain=testcases.adguard.*|surge.*\n! Test case 6: $third-party modifier\n||antibanner.net^$third-party\n! Title: Rules for extended css rules test\ntestcases.adguard.com,surge.sh###subscribe-to-test-extended-css-rules-filter\ntestcases.adguard.com,surge.sh#?##case1.banner:has(a.banner-link)\ntestcases.adguard.com,surge.sh#?##case2.banner:contains(Click Me!)\ntestcases.adguard.com,surge.sh#?##case3.banner:matches-css(opacity: 0.9)\ntestcases.adguard.com,surge.sh#?##case4.banner:matches-css-after(content: sponsored)\ntestcases.adguard.com,surge.sh#?##case5.banner:matches-css-before(content: sponsored)\ntestcases.adguard.com,surge.sh#?##case6.banner:has-text(You would want to click me for sure!)\ntestcases.adguard.com,surge.sh#?##case7.banner:-abp-has(a.banner-link)\ntestcases.adguard.com,surge.sh#?##case8.banner:contains(Click Me!)\ntestcases.adguard.com,surge.sh#?##case9.banner:contains(/[aа]{20,}/)\ntestcases.adguard.com,surge.sh#?##case10.banner:matches-css(background-image: /url\\(data\\:image\\/svg\\+xml;base64,[A-Za-z0-9]{100,}/)\ntestcases.adguard.com,surge.sh#?##case11.banner:matches-css-after(background-image: /url\\(data\\:image\\/svg\\+xml;base64,[A-Za-z0-9]{100,}/)\ntestcases.adguard.com,surge.sh#?##case12.banner:matches-css-before(background-image: /url\\(data\\:image\\/svg\\+xml;base64,[A-Za-z0-9]{100,}/)\ntestcases.adguard.com,surge.sh#?#body #case13.banner[-ext-has="a.banner-link"]\ntestcases.adguard.com,surge.sh#?#.container > #case14.banner[-ext-contains="/[aа]{20,}/"]\ntestcases.adguard.com,surge.sh#?##case14 + #case15.banner[-ext-matches-css-after="content:sponsored"]\ntestcases.adguard.com,surge.sh#?##case1 ~ #case16.banner[-ext-matches-css-before="content:sponsored"]\ntestcases.adguard.com,surge.sh#?#*:contains(/absolute[\\s\\S]*-\\d{4}/) + * > .banner:contains(/а/) ~ #case17.banner:has(> div:contains(/а/):nth-child(100n + 2))\ntestcases.adguard.com,surge.sh#?#.test-xpath-case18:xpath(//*[@class="test-case18-div"]/../..)\ntestcases.adguard.com,surge.sh#?#.test-nth-ancestor-case19:nth-ancestor(3)\ntestcases.adguard.com,surge.sh#?#.test-upward-selector:upward(#case20)\ntestcases.adguard.com,surge.sh#?#.test-upward-number-case21:upward(4)\n! Case 22\ntestcases.adguard.com,surge.sh#?##inframe1:has(.content)\ntestcases.adguard.com,surge.sh#?##case23 > div:contains(/kick me!|\\(18\\+\\)|https:\\/\\/vk.cc|testTEXT|vk.com\\/test_id/)\ntestcases.adguard.com,surge.sh#?##case24 > div:matches-attr("/^data-.{4}$/"="/banner/")\ntestcases.adguard.com,surge.sh#?##case25 > div:matches-property("id"="/property-match/")\ntestcases.adguard.com,surge.sh#?##case26:remove()\ntestcases.adguard.com,surge.sh#$?##case27:has(div) { remove: true; }\ntestcases.adguard.com,surge.sh#?##case28 > :is(.case28, #main, footer, span):contains(isTest)\n! Title: Rules for $important rules test\ntestcases.adguard.com,surge.sh###subscribe-to-test-important-rules-filter\n! Case 1\n||*/test-files/adg1.png$important\n@@||*/test-files/adg1.png\n! Case 2\n||*/test-files/adg2.png$important\n@@||*/test-files/adg2.png$important\n! Title: Rules for $replace rules test\ntestcases.adguard.com,surge.sh###subscribe-to-test-replace-rules-filter\n! Case 1: text response\n||testcases.adguard.com/*/case1-text-response.txt$replace=/adguard/Test passed/i\n||surge.sh/*/case1-text-response.txt$replace=/adguard/Test passed/i\n! Case 2: response is more then 3MB\n||testcases.adguard.com/*/case2-response-over-3mb.txt$replace=/Adguard/Replaced/i\n||surge.sh/*/case2-response-over-3mb.txt$replace=/Adguard/Replaced/i\n! Case 3: using with other rules (without $replace modifier) for a same request\n||testcases.adguard.com/*/case3-using-with-other-rules.txt$replace=/adguard/Test passed/i\n||surge.sh/*/case3-using-with-other-rules.txt$replace=/adguard/Test passed/i\n||testcases.adguard.com/*/case3-using-with-other-rules.txt\n||surge.sh/*/case3-using-with-other-rules.txt\n! Case 4: multiple $replace rules matching a single request\n||testcases.adguard.com/*/case4-multiple-replace-rules.txt$replace=/adguard/first replace rule work/i\n||surge.sh/*/case4-multiple-replace-rules.txt$replace=/adguard/first replace rule work/i\n||testcases.adguard.com/*/case4-multiple-replace-rules.txt$replace=/team/and second as well/i\n||surge.sh/*/case4-multiple-replace-rules.txt$replace=/team/and second as well/i\n! Case 5: disabling $replace rules\n||testcases.adguard.com/*/case5-disabling-replace-rule.txt$replace=/adguard/first replace rule works/i\n||surge.sh/*/case5-disabling-replace-rule.txt$replace=/adguard/first replace rule works/i\n||testcases.adguard.com/*/case5-disabling-replace-rule.txt$replace=/team/and second as well/i\n||surge.sh/*/case5-disabling-replace-rule.txt$replace=/team/and second as well/i\n@@||testcases.adguard.com/*/case5-disabling-replace-rule.txt$replace\n@@||surge.sh/*/case5-disabling-replace-rule.txt$replace\n! Case 6: multiple $replace rules\n||testcases.adguard.com/*/case6-disabling-multiple-replace-rules.txt$replace=/adguard/first replace rule/i\n||surge.sh/*/case6-disabling-multiple-replace-rules.txt$replace=/adguard/first replace rule/i\n||testcases.adguard.com/*/case6-disabling-multiple-replace-rules.txt$replace=/works/works and second as well/i\n||surge.sh/*/case6-disabling-multiple-replace-rules.txt$replace=/works/works and second as well/i\n@@||testcases.adguard.com/*/case6-disabling-multiple-replace-rules.txt$replace=/works/works and second as well/i\n@@||surge.sh/*/case6-disabling-multiple-replace-rules.txt$replace=/works/works and second as well/i\n! Case 7: using with $script exception modifier for a same request\n||testcases.adguard.com/*/case7-content-type-modifier.js$replace=/tmp\\s+\\=\\s+0/tmp = 1/i\n||surge.sh/*/case7-content-type-modifier.js$replace=/tmp\\s+\\=\\s+0/tmp = 1/i\n||testcases.adguard.com/*/case7-content-type-modifier.js$script\n||surge.sh/*/case7-content-type-modifier.js$script',
            [UserFilterOption.DisabledRules]: '',
        },
        [FiltersOption.Allowlist]: {
            [AllowlistOption.Enabled]: true,
            [AllowlistOption.Inverted]: false,
            [AllowlistOption.Domains]: ['domain1.com', 'domain2.com'],
            [AllowlistOption.InvertedDomains]: ['domain3.com', 'domain4.com'],
        },
    },
    [RootOption.Stealth]: {
        [StealthOption.DisableStealthMode]: false,
        [StealthOption.HideReferrer]: true,
        [StealthOption.HideSearchQueries]: true,
        [StealthOption.SendDoNotTrack]: true,
        [StealthOption.BlockWebRTC]: true,
        [StealthOption.RemoveXClientData]: true,
        [StealthOption.SelfDestructThirdPartyCookies]: true,
        [StealthOption.SelfDestructThirdPartyCookiesTime]: 3333,
        [StealthOption.SelfDestructFirstPartyCookies]: true,
        [StealthOption.SelfDestructFirstPartyCookiesTime]: 8888,
        [StealthOption.BlockKnownTrackers]: true,
        [StealthOption.StripTrackingParams]: true,
    },
});
