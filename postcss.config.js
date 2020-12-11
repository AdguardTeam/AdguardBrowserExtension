module.exports = {
    plugins: [
        ['postcss-import', {}],
        ['postcss-preset-env', { stage: 3, features: { 'nesting-rules': true } }],
        ['postcss-svg', {}],
        ['postcss-nested', {}],
    ],
};
