/**
 * Copyright (c) 2015-2026 Adguard Software Ltd.
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
