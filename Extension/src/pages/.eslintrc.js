/**
 * @file
 * This config is used for linting of the page directory.
 */
// TODO consider removing this file and using the base config instead
module.exports = {
    extends: [
        '../../../.eslintrc.js',
    ],
    parserOptions: {
        project: '../../../tsconfig.json',
        tsconfigRootDir: __dirname,
        sourceType: 'module',
    },
    'rules': {
        'import/prefer-default-export': 'off',
        'max-len': 'off',
        'no-use-before-define': 'off',
        'indent': [
            'error',
            4,
            {
                'SwitchCase': 1,
            },
        ],
        'arrow-body-style': 'off',
        'func-names': ['error', 'as-needed'],
        'no-param-reassign': [
            'error',
            {
                'props': false,
            },
        ],

        'react/prop-types': 'off',
        'react/jsx-indent': ['error', 4],
        'react/jsx-indent-props': ['error', 4],
        'react/forbid-prop-types': 'off',
        'react/jsx-props-no-spreading': 'off',
        'react/jsx-filename-extension': [
            1,
            {
                'extensions': ['.js', '.jsx', '.ts', '.tsx'],
            },
        ],
    },
};
