import cpy from 'cpy';

export const copyExternals = async () => {
    const paths = [
        {
            from: [
                // TODO check necessity of this file
                'node_modules/scriptlets/dist/redirects.yml',
            ],
            to: 'Extension/lib/libs/scriptlets',
        },
        {
            from: 'node_modules/scriptlets/dist/redirect-files/*',
            to: 'Extension/web-accessible-resources/redirects',
        },
    ];
    // eslint-disable-next-line no-restricted-syntax
    for (const path of paths) {
        // eslint-disable-next-line no-await-in-loop
        await cpy(path.from, path.to, path.options);
    }
};
