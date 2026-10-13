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

import { NetworkSettings } from '../../../../../Extension/src/background/api/network/settings/settings-mv3';
import { UserAgent } from '../../../../../Extension/src/common/user-agent';

describe.skipIf(!__IS_MV3__)('MV3 filter URLs', () => {
    it.each([true, false])('uses the dedicated endpoint when isEdge=%s', async (isEdge) => {
        const original = UserAgent.isEdge;
        UserAgent.isEdge = isEdge;
        try {
            const settings = new NetworkSettings();
            await settings.init();
            const platform = isEdge ? 'edge-mv3' : 'chromium-mv3';
            expect(settings.filterRulesUrl)
                .toBe(`https://filters.adtidy.org/extension/${platform}/filters/{filter_id}.txt`);
        } finally {
            UserAgent.isEdge = original;
        }
    });
});
