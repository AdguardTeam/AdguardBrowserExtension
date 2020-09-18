module.exports = (api) => {
    api.cache(false);
    return {
        presets: [['@babel/preset-env', {
            targets: {
                chrome: '55',
                firefox: '52',
                opera: '42',
            },
        }]],
        'plugins': [
            '@babel/plugin-transform-runtime',
            '@babel/plugin-proposal-optional-chaining',
        ],
    };
};
