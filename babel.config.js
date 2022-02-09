module.exports = (api) => {
    api.cache(false);
    return {
        presets: [['@babel/preset-env', {
            targets: {
                chrome: '79',
                firefox: '78',
                opera: '66',
            },
            loose: true,
            useBuiltIns: 'usage',
            corejs: { version: 3, proposals: true },
        }], '@babel/preset-react'],
        'plugins': [
            ['@babel/plugin-proposal-decorators', { legacy: true }],
            ['@babel/plugin-proposal-class-properties', { loose: true }],
            '@babel/plugin-transform-runtime',
            '@babel/plugin-proposal-optional-chaining',
        ],
    };
};
