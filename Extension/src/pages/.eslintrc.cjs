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
        project: '../../../tsconfig.eslint.json',
        tsconfigRootDir: __dirname,
        sourceType: 'module',
    },
    'rules': {
        '@typescript-eslint/indent': [
            'error',
            4,
            {
                SwitchCase: 1,
                ignoredNodes: [
                    // indentation for props with decorators is not working as expecting,
                    // that is why we are disabling it
                    'PropertyDefinition[decorators]',
                ],
            },
        ],

        'import/prefer-default-export': 'off',
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
