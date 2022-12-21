module.exports = {
    extends: [
        '../.eslintrc.js',
    ],
    parserOptions: {
        project: '../tsconfig.json',
        tsconfigRootDir: __dirname,
        sourceType: 'module',
    },
    'rules': {
        'jsdoc/require-file-overview': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
    },
};
