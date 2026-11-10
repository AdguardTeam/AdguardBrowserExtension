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

import { createRequire } from 'node:module';

import {
    describe,
    expect,
    it,
} from 'vitest';

import { getSwcTargets, OBJECT_CREATE_MODULE_REGEX } from '../../../tools/bundle/swc-config';

const require = createRequire(import.meta.url);

describe('SWC build config', () => {
    describe('OBJECT_CREATE_MODULE_REGEX', () => {
        it('matches the resolved core-js object-create module', () => {
            const modulePath = require.resolve('core-js/internals/object-create.js');

            expect(OBJECT_CREATE_MODULE_REGEX.test(modulePath)).toBe(true);
        });
    });

    describe('getSwcTargets', () => {
        it('uses the Chromium MV3 target for MV3 builds', () => {
            expect(getSwcTargets(true)).toEqual({ chrome: '121' });
        });

        it('uses the MV2 targets for MV2 builds', () => {
            expect(getSwcTargets(false)).toEqual({
                chrome: '79',
                firefox: '78',
                opera: '67',
            });
        });
    });
});
