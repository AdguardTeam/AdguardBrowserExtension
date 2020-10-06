export const adgSettings = JSON.stringify({
    'protocol-version': '1.0',
    'general-settings': {
        'app-language': 'en-GB',
        'allow-acceptable-ads': true,
        'show-blocked-ads-count': true,
        'autodetect-filters': true,
        'safebrowsing-enabled': true,
        'filters-update-period': -1,
    },
    'extension-specific-settings': {
        'use-optimized-filters': false,
        'collect-hits-count': false,
        'show-context-menu': true,
        'show-info-about-adguard': true,
        'show-app-updated-info': true,
    },
    'filters': {
        'enabled-groups': [1, 2, 3, 4, 5, 6, 7],
        'enabled-filters': [208, 10, 14, 1, 2, 3, 4, 210, 242],
        'custom-filters': [],
        'user-filter': {
            'rules': '',
            'disabled-rules': '',
        },
        'whitelist': {
            'inverted': false,
            'domains': [],
            'inverted-domains': [],
        },
    },
});
