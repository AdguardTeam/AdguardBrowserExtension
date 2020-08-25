import { ENVS } from '../constants';

const APP_ID_MAP = {
    [ENVS.DEV]: 'adguard-vpn-dev@adguard.com',
    [ENVS.BETA]: 'adguard-vpn-beta@adguard.com',
    [ENVS.RELEASE]: 'adguard-vpn@adguard.com',
};

const appId = APP_ID_MAP[process.env.BUILD_ENV];

export const firefoxManifest = {
    'applications': {
        'gecko': {
            'id': appId,
            'strict_min_version': '52.0',
        },
    },
    'content_scripts': [
        {
            'all_frames': false,
            'js': [
                'lib/content-script/content-script.js',
                'lib/content-script/i18n-helper.js',
                'lib/content-script/assistant/js/start-assistant.js',
            ],
            'matches': [
                'http://*/*',
                'https://*/*',
            ],
            'run_at': 'document_end',
        },
    ],
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
