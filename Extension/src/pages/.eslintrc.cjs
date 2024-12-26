/**
 * @file
 * This config is used for linting of the page directory.
 */
// TODO consider removing this file and using the base config instead
module.exports = {
    extends: [
        '../../../.eslintrc.cjs',
    ],
    parserOptions: {
        project: '../../../tsconfig.json',
        tsconfigRootDir: __dirname,
        sourceType: 'module',
    },
    'rules': {
        '@typescript-eslint/indent': [
            'error',
            4,
            {
                SwitchCase: 1,
                // TODO: Currently 'Decorator' is not supported with @typescript-eslint/parser@7,
                // but we cannot update it to 8 because of the incompatibility with other plugins.
                // So we should to update it with `eslint-config-airbnb-typescript`.
                ignoredNodes: ['Decorator'],
            },
        ],

        'import/prefer-default-export': 'off',
        'max-len': 'off',
        'no-use-before-define': 'off',
        'indent': 'off',
        'arrow-body-style': 'off',
        'func-names': ['error', 'as-needed'],
        'no-param-reassign': [
            'error',
            {
                'props': false,
            },
        ],

        'react/jsx-indent': 'off',
        'react/jsx-indent-props': 'off',
        'react/prop-types': 'off',
        'react/require-default-props': 'off',
        'react/forbid-prop-types': 'off',
        'react/jsx-props-no-spreading': 'off',
        'react/jsx-filename-extension': [
            1,
            {
                'extensions': ['.js', '.jsx', '.ts', '.tsx'],
            },
        ],
        'react/function-component-definition': [
            2,
            { 'namedComponents': 'arrow-function' },
        ],
    },
};
