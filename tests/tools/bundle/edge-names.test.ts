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

import {
    describe,
    expect,
    it,
} from 'vitest';

import { BuildTargetEnv } from '../../../constants';
import { Browser } from '../../../tools/constants';
import { updateLocalesMSGName } from '../../../tools/helpers';

describe('Edge extension names', () => {
    it.each([
        [Browser.Edge, BuildTargetEnv.Dev, 'AdGuard (MV2 Dev)'],
        [Browser.EdgeMv3, BuildTargetEnv.Dev, 'AdGuard (MV3 Dev)'],
        [Browser.Edge, BuildTargetEnv.Beta, 'AdGuard (Beta)'],
        [Browser.EdgeMv3, BuildTargetEnv.Beta, 'AdGuard (Beta)'],
        [Browser.Edge, BuildTargetEnv.Release, 'AdGuard'],
        [Browser.EdgeMv3, BuildTargetEnv.Release, 'AdGuard'],
    ] as const)('%s in %s is named %s', (browser, env, expected) => {
        const messages = Buffer.from(JSON.stringify({ name: { message: 'AdGuard' } }));
        const result = JSON.parse(updateLocalesMSGName(messages, env, browser));
        expect(result.name.message).toBe(expected);
    });
});
