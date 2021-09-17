export const chromeManifest = {
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
