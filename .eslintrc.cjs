/**
 * @file Base eslint config for AdGuard extension
 */
module.exports = {
    'root': true,
    'env': {
        'browser': true,
        'node': true,
    },
    'globals': {
        'adguard': true,
        'chrome': true,
        'page': true,
        'context': true,
        __IS_MV3__: true,
    },
    'parser': '@typescript-eslint/parser',
    'parserOptions': {
        'ecmaVersion': 2020,
        'sourceType': 'module',
        'ecmaFeatures': {
            'jsx': true,
        },
        'project': 'tsconfig.eslint.json',
    },
    'settings': {
        'react': {
            'version': 'detect',
        },
        'import/resolver': {
            'typescript': {
                'alwaysTryTypes': true,
                'project': 'tsconfig.eslint.json',
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
        '@adguard/logger-context',
    ],
    'rules': {
        'no-console': 'error',
        'no-await-in-loop': 'off',
        '@typescript-eslint/no-use-before-define': 'off',
        '@typescript-eslint/indent': 'off',
        '@typescript-eslint/no-shadow': 'off',
        '@typescript-eslint/dot-notation': 'off',
        '@typescript-eslint/member-delimiter-style': 'error',
        '@typescript-eslint/consistent-type-imports': [
            'error', {
                fixStyle: 'inline-type-imports',
            },
        ],
        'import/no-extraneous-dependencies': 'off',
        'import/no-cycle': 'off',
        'import/prefer-default-export': 'off',
        'import/extensions': 'off',
        'import/no-named-as-default': 'error',
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
                    { 'pattern': '*react*', 'group': 'external', 'position': 'before' },
                    // Place all our libraries after react-like
                    { 'pattern': '@adguard/**', 'group': 'external', 'position': 'after' },
                    // Place app alias after internal
                    { 'pattern': 'app', 'group': 'internal', 'position': 'after' },
                    // Place engine alias after internal
                    { 'pattern': 'engine', 'group': 'internal', 'position': 'after' },
                    // Place tswebextension alias after internal
                    { 'pattern': 'tswebextension', 'group': 'internal', 'position': 'after' },
                    // Place scripting-service alias after internal
                    { 'pattern': 'scripting-service', 'group': 'internal', 'position': 'after' },
                    // Place settings-service alias after internal
                    { 'pattern': 'settings-service', 'group': 'internal', 'position': 'after' },
                    // Place filters-service alias after internal
                    { 'pattern': 'filters-service', 'group': 'internal', 'position': 'after' },
                    // Place custom-filters-service alias after internal
                    { 'pattern': 'custom-filters-service', 'group': 'internal', 'position': 'after' },
                    // Place extension-update-service alias after internal
                    { 'pattern': 'extension-update-service', 'group': 'internal', 'position': 'after' },
                    // Place rules-limits-service alias after internal
                    { 'pattern': 'rules-limits-service', 'group': 'internal', 'position': 'after' },
                    // Separate group for all .pcss styles
                    // eslint-disable-next-line max-len, object-curly-newline
                    { 'pattern': '*.pcss', 'group': 'object', 'patternOptions': { 'matchBase': true }, 'position': 'after' },
                ],
                'pathGroupsExcludedImportTypes': ['builtin', 'react'],
                'newlines-between': 'always',
                // To include "side effect imports" in plugin checks
                // (like "import 'styles.pcss';")
                'warnOnUnassignedImports': true,
            },
        ],
        'strict': 'off',
        'max-len': ['error', {
            'code': 120,
            'comments': 120,
            'tabWidth': 4,
            'ignoreUrls': true,
            'ignoreTrailingComments': false,
            'ignoreComments': false,
            'ignoreTemplateLiterals': true,
            /**
             * Ignore calls to logger, e.g. logger.error(), because of the long string.
             */
            'ignorePattern': 'logger\\.',
        }],
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
        'prefer-destructuring': 'off',
        'brace-style': ['error', '1tbs', { 'allowSingleLine': false }],
        'consistent-return': 'off',
        'curly': ['error', 'all'],
        'dot-notation': 'off',
        'quote-props': 'off',
        'arrow-body-style': 'off',
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
        'no-restricted-syntax': [
            'error',
            {
                selector: 'ExportAllDeclaration',
                message: 'Wildcard exports are not allowed.',
            },
        ],
        'no-prototype-builtins': 'off',
        'no-continue': 'off',
        'no-bitwise': 'off',
        'no-underscore-dangle': 'off',
        // types described in ts
        'jsdoc/require-param-type': 'off',
        'jsdoc/require-returns-type': 'off',
        'jsdoc/require-throws': 'error',
        'jsdoc/require-file-overview': 'error',

        'jsx-a11y/control-has-associated-label': 'off',
        'jsx-a11y/label-has-associated-control': 'off',

        // These rules are enabled for background only see Extension/src/background/.eslintrc.cjs
        // TODO: consider enabling them for the whole project later
        '@typescript-eslint/explicit-function-return-type': 'off',
        'jsdoc/require-param-description': 'off',
        'jsdoc/require-property-description': 'off',
        'jsdoc/require-returns-description': 'off',
        'jsdoc/require-returns': 'off',
        'jsdoc/require-param': 'off',
        'jsdoc/no-undefined-types': 'off',
        'jsdoc/require-returns-check': 'off',
        'jsdoc/require-jsdoc': 'off',
        'jsdoc/check-tag-names': [
            'warn',
            {
                // Define additional tags
                // https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/check-tag-names.md#definedtags
                definedTags: ['note'],
            },
        ],
        'jsdoc/no-defaults': 'off',
        'jsdoc/tag-lines': [
            'error',
            'any',
            {
                startLines: 1,
            },
        ],
        'jsdoc/sort-tags': ['error', {
            linesBetween: 1,
            tagSequence: [
                { tags: ['file'] },
                { tags: ['template', 'class', 'async'] },
                { tags: ['note'] },
                { tags: ['see'] },
                { tags: ['param'] },
                { tags: ['returns'] },
                { tags: ['throws'] },
                { tags: ['example'] },
            ],
        }],
        // Check that every logger call has a context tag.
        '@adguard/logger-context/require-logger-context': ['error', {
            contextModuleName: 'ext',
        }],
    },
    'ignorePatterns': [
        'node_modules',
        'build',
        'Extension/web-accessible-resources',
        'coverage',
        // Directory for temporary files
        'tmp/',
    ],
};
