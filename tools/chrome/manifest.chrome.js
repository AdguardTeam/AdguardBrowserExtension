export const chromeManifest = {
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
    'options_page': 'pages/options.html',
    'devtools_page': 'devtools.html',
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
