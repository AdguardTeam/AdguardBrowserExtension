/**
 * Copyright (c) 2015-2025 Adguard Software Ltd.
 *
 * @file
 * This file is part of AdGuard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * AdGuard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * AdGuard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with AdGuard Browser Extension. If not, see <http://www.gnu.org/licenses/>.
 *
 * This config is used for linting of the background directory.
 */

module.exports = {
    extends: '../../.eslintrc.cjs',
    parserOptions: {
        project: '../../tsconfig.json',
        tsconfigRootDir: __dirname,
        sourceType: 'module',
    },
    rules: {
        '@typescript-eslint/no-explicit-any': 'error',
        '@typescript-eslint/explicit-function-return-type': 'error',

        'jsdoc/require-param-description': 'error',
        'jsdoc/require-property-description': 'error',
        'jsdoc/require-returns-description': 'error',
        'jsdoc/require-returns': 'error',
        'jsdoc/require-param': 'error',
        'jsdoc/no-undefined-types': 'error',
        'jsdoc/require-returns-check': 'error',
        'jsdoc/require-description-complete-sentence': ['error'],
        'jsdoc/require-jsdoc': [
            'error',
            {
                contexts: [
                    'ClassDeclaration',
                    'ClassProperty',
                    'FunctionDeclaration',
                    'MethodDefinition',
                    'ArrowFunctionExpression',
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
                    'ArrowFunctionExpression',
                ],
            },
        ],
    },
};
