/**
 * @file
 * This config is used for linting of the background directory.
 */
module.exports = {
    extends: '../../../.eslintrc.js',
    parserOptions: {
        project: '../../../tsconfig.json',
        tsconfigRootDir: __dirname,
        sourceType: 'module',
    },
    rules: {
        '@typescript-eslint/no-explicit-any': 'error',

        '@typescript-eslint/explicit-function-return-type': 'error',
        'jsdoc/require-param-description': 'error',
        'jsdoc/require-property-description': 'error',
        'jsdoc/require-returns-description': 'error',
        'jsdoc/require-returns': 'error',
        'jsdoc/require-param': 'error',
        'jsdoc/no-undefined-types': 'error',
        'jsdoc/require-returns-check': 'error',
        'jsdoc/require-jsdoc': 'error',
    },
};
