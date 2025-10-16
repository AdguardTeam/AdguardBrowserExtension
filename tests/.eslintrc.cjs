module.exports = {
    extends: [
        '../.eslintrc.cjs',
    ],
    parserOptions: {
        project: '../tsconfig.eslint.json',
        tsconfigRootDir: __dirname,
        sourceType: 'module',
    },
    'rules': {
        'jsdoc/require-file-overview': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
    },
};
