module.exports = (api) => {
    api.cache(false);
    return {
        presets: [['@babel/preset-env', {
            targets: {
                chrome: '55',
                firefox: '52',
                opera: '42',
            },
        }], '@babel/preset-react'],
        'plugins': [
            ['@babel/plugin-proposal-decorators', { legacy: true }],
            ['@babel/plugin-proposal-class-properties', { loose: true }],
            '@babel/plugin-transform-runtime',
            '@babel/plugin-proposal-optional-chaining',
        ],
    };
};
