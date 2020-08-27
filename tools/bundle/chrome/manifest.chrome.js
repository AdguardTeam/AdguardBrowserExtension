export const chromeManifest = {
    'content_scripts': [
        {
            'all_frames': false,
            'js': [
                'lib/content-script/i18n-helper.js',
                'lib/content-script/devtools/devtools-rules-constructor.js',
                'lib/content-script/assistant/start-assistant.js',
                'lib/content-script/devtools-helper.js',
            ],
            'matches': [
                'http://*/*',
                'https://*/*',
            ],
            'run_at': 'document_end',
        },
    ],
    'options_page': 'pages/options.html',
    'devtools_page': 'pages/devtools.html',
    'permissions': [
        'tabs',
        '<all_urls>',
        'webRequest',
        'webRequestBlocking',
        'webNavigation',
        'storage',
        'unlimitedStorage',
        'contextMenus',
        'cookies',
    ],
    'optional_permissions': [
        'privacy',
    ],
};
