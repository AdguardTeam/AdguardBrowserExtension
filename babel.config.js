/**
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

module.exports = (api) => {
    api.cache(false);
    return {
        presets: [
            [
                '@babel/preset-env',
                {
                    targets: {
                        chrome: '79',
                        firefox: '78',
                        opera: '66',
                    },
                    loose: true,
                    useBuiltIns: 'usage',
                    corejs: { version: 3, proposals: true },
                },
            ],
            '@babel/preset-react',
            '@babel/preset-typescript',
        ],
        plugins: [
            ['@babel/plugin-proposal-decorators', { legacy: true }],
            ['@babel/plugin-proposal-class-properties', { loose: true }],
            '@babel/plugin-transform-runtime',
            '@babel/plugin-proposal-optional-chaining',
        ],
    };
};
