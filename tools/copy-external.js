import cpy from 'cpy';

// TODO move to modules, import assistant into content script, and scriptlets into background page
const copyExternals = async () => {
    const paths = [
        // TODO check is scriptlets should be copied as well
        // redirects
        {
            from: [
                'node_modules/scriptlets/dist/redirects.yml',
                'node_modules/scriptlets/dist/redirects.js',
            ],
            to: 'Extension/lib/libs/scriptlets',
        },
        {
            from: 'node_modules/scriptlets/dist/redirect-files/*',
            to: 'Extension/web-accessible-resources/redirects',
        },
        {
            to: 'Extension/lib/content-script/assistant',
            from: 'node_modules/adguard-assistant/dist/assistant.embedded.js',
            options: {
                rename: 'assistant.js',
            },
        },
    ];
    // eslint-disable-next-line no-restricted-syntax
    for (const path of paths) {
        // eslint-disable-next-line no-await-in-loop
        await cpy(path.from, path.to, path.options);
    }
};

(async () => {
    await copyExternals();
})();
