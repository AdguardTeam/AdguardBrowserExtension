module.exports = {
    env: {
        browser: true,
    },
    extends: [
        'plugin:react/recommended',
        'airbnb',
        'plugin:react-hooks/recommended',
    ],
    parserOptions: {
        ecmaFeatures: {
            jsx: true,
        },
        ecmaVersion: 12,
        sourceType: 'module',
    },
    plugins: [
        'react',
    ],
    rules: {
        'no-use-before-define': 'off',
        'react/jsx-filename-extension': [
            1,
            {
                extensions: [
                    '.js',
                    '.jsx',
                ],
            },
        ],
        indent: ['error', 4, {
            SwitchCase: 1,
        }],
        'react/jsx-indent': ['error', 4],
        'react/jsx-indent-props': ['error', 4],
        'import/prefer-default-export': 'off',
        'react/prop-types': 'off', // TODO enable prop-types validation
        'arrow-body-style': 'off',
        'react/jsx-props-no-spreading': 'off',
        'func-names': ['error', 'as-needed'],
        'no-param-reassign': ['error', { props: false }],
    },
};
