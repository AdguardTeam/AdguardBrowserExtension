/**
 * @file
 * This config is used for linting of the background directory.
 */
module.exports = {
    extends: '../.eslintrc.js',
    parserOptions: {
        project: '../../../../tsconfig.json',
        tsconfigRootDir: __dirname,
        sourceType: 'module',
    },
    rules: {
        '@typescript-eslint/explicit-function-return-type': 'error',

        'jsdoc/require-jsdoc': [
            'error',
            {
                contexts: [
                    'ClassDeclaration',
                    'ClassProperty',
                    'FunctionDeclaration',
                    'MethodDefinition',
                ],
            },
        ],
        'jsdoc/require-description': [
            'error',
            {
                contexts: [
                    'ClassDeclaration',
                    'ClassProperty',
                    'FunctionDeclaration',
                    'MethodDefinition',
                ],
            },
        ],
        'jsdoc/require-description-complete-sentence': ['error'],
    },
};
