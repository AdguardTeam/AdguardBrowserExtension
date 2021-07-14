import { browserUtils } from '../utils/browser-utils';
import { prefs } from '../prefs';

/**
 * Default settings set
 */
export const defaultSettings = {
    'general-settings': {
        'allow-acceptable-ads': true,
        'show-blocked-ads-count': true,
        'autodetect-filters': true,
        'safebrowsing-enabled': false,
        'filters-update-period': -1,
        'appearance-theme': 'system',
    },
    'extension-specific-settings': {
        'use-optimized-filters': prefs.mobile,
        'collect-hits-count': false,
        'show-context-menu': true,
        'show-info-about-adguard': (browserUtils.isWindowsOs() || browserUtils.isMacOs())
            && !browserUtils.isEdgeBrowser(),
        'show-app-updated-info': true,
    },
    'filters': {
        'enabled-groups': [
            1,
            4,
            6,
            7,
        ],
        'enabled-filters': [
            10,
            14,
            2,
        ],
        'custom-filters': [],
        'user-filter': {
            'rules': '',
            'disabled-rules': '',
            'enabled': true,
        },
        'whitelist': {
            'inverted': false,
            'domains': [],
            'inverted-domains': [],
            'enabled': true,
        },
    },
    'stealth': {
        'stealth_disable_stealth_mode': true,
        'stealth-hide-referrer': true,
        'stealth-hide-search-queries': true,
        'stealth-send-do-not-track': true,
        'stealth-block-webrtc': false,
        'stealth-block-third-party-cookies': true,
        'stealth-block-third-party-cookies-time': '2880',
        'stealth-block-first-party-cookies': false,
        'stealth-block-first-party-cookies-time': '4320',
        'strip-tracking-parameters': false,
    },
};
