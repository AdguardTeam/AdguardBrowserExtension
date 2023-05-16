/**
 * @file Base eslint config for AdGuard extension
 */
module.exports = {
    'root': true,
    'env': {
        'browser': true,
        'node': true,
        'jest': true,
    },
    'globals': {
        'adguard': true,
        'chrome': true,
        'page': true,
        'context': true,
        'jestPuppeteer': true,
    },
    'parser': '@typescript-eslint/parser',
    'parserOptions': {
        'ecmaVersion': 2020,
        'sourceType': 'module',
        'ecmaFeatures': {
            'jsx': true,
        },
        'project': 'tsconfig.json',
    },
    'settings': {
        'react': {
            'version': 'detect',
        },
        'import/resolver': {
            'typescript': {
                'alwaysTryTypes': true,
            },
            'node': {
                'extensions': [
                    '.js',
                    '.jsx',
                    '.ts',
                    '.tsx',
                ],
            },
        },
    },
    'extends': [
        'airbnb',
        'airbnb-typescript',
        'airbnb/hooks',
        'plugin:jsdoc/recommended',
    ],
    'plugins': [
        'import-newlines',
    ],
    'rules': {
        'no-console': 'error',
        '@typescript-eslint/no-use-before-define': 'off',
        '@typescript-eslint/indent': 'off',
        '@typescript-eslint/no-shadow': 'off',
        '@typescript-eslint/dot-notation': 'off',
        'import/no-extraneous-dependencies': 'off',
        'import/no-cycle': 'off',
        'import/prefer-default-export': 'off',
        'import/extensions': 'off',
        'import-newlines/enforce': ['error', 2, 120],
        'import/order': [
            'error',
            {
                'groups': [
                    'builtin',
                    'external',
                    'internal',
                    'parent',
                    'sibling',
                    'index',
                    'object',
                ],
                'pathGroups': [
                    // Place all react libraries after external
                    {
                        'pattern': '*react*',
                        'group': 'external',
                        'position': 'before',
                    },
                    // Place all our libraries after react-like
                    {
                        'pattern': '@adguard/*',
                        'group': 'external',
                        'position': 'after',
                    },
                    // Separate group for all .pcss styles
                    {
                        'pattern': '*.pcss',
                        'group': 'object',
                        'patternOptions': { 'matchBase': true },
                        'position': 'after',
                    },
                ],
                'pathGroupsExcludedImportTypes': ['builtin', 'react'],
                'newlines-between': 'always',
                // To include "side effect imports" in plugin checks
                // (like "import 'styles.pcss';")
                'warnOnUnassignedImports': true,
            },
        ],
        'strict': 'off',
        'max-len': [
            'error',
            {
                'code': 120,
            },
        ],
        'indent': [
            'error',
            4,
            {
                'SwitchCase': 1,
                'ignoreComments': false,
            },
        ],
        'wrap-iife': 'off',
        'func-names': 'off',
        'prefer-destructuring': [
            'error',
            {
                'VariableDeclarator': {
                    'array': false,
                    'object': true,
                },
                'AssignmentExpression': {
                    'array': true,
                    'object': false,
                },
            },
            {
                'enforceForRenamedProperties': false,
            },
        ],
        'consistent-return': 'off',
        'dot-notation': 'off',
        'quote-props': 'off',
        'arrow-body-style': 'off',
        'arrow-parens': 'off',
        'no-use-before-define': 'off',
        'no-useless-escape': 'off',
        'no-param-reassign': 'off',
        'no-shadow': 'off',
        'no-multi-spaces': [
            'error',
            {
                'ignoreEOLComments': true,
            },
        ],
        'no-prototype-builtins': 'off',
        'no-continue': 'off',
        'no-bitwise': 'off',
        'no-underscore-dangle': 'off',
        // types described in ts
        'jsdoc/require-param-type': 'off',
        'jsdoc/require-returns-type': 'off',
        'jsdoc/tag-lines': 'off',
        'jsdoc/require-throws': 'error',
        'jsdoc/require-file-overview': 'error',

        // These rules are enabled for background only see Extension/src/background/.eslintrc.js
        // TODO consider enabling them for the whole project later
        '@typescript-eslint/explicit-function-return-type': 'off',
        'jsdoc/require-param-description': 'off',
        'jsdoc/require-property-description': 'off',
        'jsdoc/require-returns-description': 'off',
        'jsdoc/require-returns': 'off',
        'jsdoc/require-param': 'off',
        'jsdoc/no-undefined-types': 'off',
        'jsdoc/require-returns-check': 'off',
        'jsdoc/require-jsdoc': 'off',
    },
    'ignorePatterns': [
        'node_modules',
        'build',
        'Extension/web-accessible-resources',
    ],
};
