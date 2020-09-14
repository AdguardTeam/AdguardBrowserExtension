import packageJson from '../../../package.json';

export const adguardApiManifest = {
    'manifest_version': 2,
    'name': 'Sample Adguard API',
    'short_name': 'Sample Adguard API',
    'author': 'Adguard Software Ltd.',
    'version': packageJson.version,
    'description': 'Sample extension using Adguard API',
    'background': {
        'page': 'background.html',
        'persistent': true,
    },
    'browser_action': {
        'default_title': 'Sample Extension',
        'default_popup': 'popup.html',
    },
    'content_scripts': [
        {
            'all_frames': true,
            'js': ['adguard-content.js'],
            'matches': [
                'http://*/*',
                'https://*/*',
            ],
            'match_about_blank': true,
            'run_at': 'document_start',
        },
        {
            'all_frames': false,
            'js': ['adguard-assistant.js'],
            'matches': [
                'http://*/*',
                'https://*/*',
            ],
            'run_at': 'document_end',
        },
    ],
    'minimum_chrome_version': '55.0',
    'permissions': [
        '<all_urls>',
        'tabs',
        'webRequest',
        'webRequestBlocking',
        'webNavigation',
        'storage',
        'unlimitedStorage',
        'contextMenus',
        'cookies',
    ],
};
