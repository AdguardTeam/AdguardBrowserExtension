import { FIREFOX_APP_IDS_MAP } from '../../constants';

const appId = FIREFOX_APP_IDS_MAP[process.env.BUILD_ENV];

export const firefoxManifest = {
    'browser_specific_settings': {
        'gecko': {
            'id': appId,
            'strict_min_version': '78.0',
        },
    },
    'options_ui': {
        'page': 'pages/options.html',
        'open_in_tab': true,
    },
    'permissions': [
        'tabs',
        '<all_urls>',
        'webRequest',
        'webRequestBlocking',
        'webNavigation',
        'storage',
        'contextMenus',
        'cookies',
        'privacy',
    ],
};
