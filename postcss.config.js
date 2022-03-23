const postcssPresetEnv = require('postcss-preset-env');

module.exports = {
    plugins: [
        [postcssPresetEnv, { stage: 3, features: { 'nesting-rules': true } }],
        ['postcss-svg', {}],
        ['postcss-nested', {}],
    ],
};
