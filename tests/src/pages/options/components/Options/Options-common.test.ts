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
    vi,
} from 'vitest';

import { NotifierType } from '../../../../../../Extension/src/common/constants';
import {
    createCommonMessageHandler,
} from '../../../../../../Extension/src/pages/options/components/Options/Options-common';

describe('createCommonMessageHandler', () => {
    it('updates availableUpdateVersion when background check result changes', async () => {
        const setAvailableUpdateVersion = vi.fn();
        const settingsStore = {
            setAvailableUpdateVersion,
        } as unknown as Parameters<typeof createCommonMessageHandler>[0];
        const uiStore = {} as unknown as Parameters<typeof createCommonMessageHandler>[1];
        const handler = createCommonMessageHandler(settingsStore, uiStore);

        await handler({
            type: NotifierType.AvailableUpdateVersionChanged,
            data: ['5.4.1'],
        });

        expect(setAvailableUpdateVersion).toHaveBeenCalledWith('5.4.1');

        await handler({
            type: NotifierType.AvailableUpdateVersionChanged,
            data: [undefined],
        });

        expect(setAvailableUpdateVersion).toHaveBeenCalledWith(undefined);
    });
});
