module.exports = {
    env: {
        browser: true,
        es2021: true,
    },
    extends: [
        'plugin:react/recommended',
        'airbnb',
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
    },
};
