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
    it,
    expect,
    vi,
    beforeEach,
} from 'vitest';
import { FilterUpdateService } from 'filter-update-service';

const storage: Record<string, unknown> = {};

vi.mock('../../../../../Extension/src/background/storages', () => ({
    browserStorage: {
        get: vi.fn((key: string) => Promise.resolve(storage[key])),
        set: vi.fn((key: string, value: unknown) => {
            storage[key] = value;
            return Promise.resolve();
        }),
    },
}));

// Arbitrary timestamps; the exact values have no special meaning.
const SOME_TIMESTAMP_MS = 1_700_000_000_000;
const SOME_LATER_TIMESTAMP_MS = 1_700_000_001_000;

describe('FilterUpdateServiceCommon — last check time', () => {
    beforeEach(() => {
        Object.keys(storage).forEach((k) => delete storage[k]);
        vi.clearAllMocks();
    });

    it('returns 0 when nothing is stored', async () => {
        const result = await FilterUpdateService.getLastCheckTimeMs();
        expect(result).toBe(0);
    });

    it('stores and retrieves the check timestamp', async () => {
        await FilterUpdateService.setLastCheckTimeMs(SOME_TIMESTAMP_MS);
        const result = await FilterUpdateService.getLastCheckTimeMs();
        expect(result).toBe(SOME_TIMESTAMP_MS);
    });

    it('overwrites with a newer timestamp', async () => {
        await FilterUpdateService.setLastCheckTimeMs(SOME_TIMESTAMP_MS);
        await FilterUpdateService.setLastCheckTimeMs(SOME_LATER_TIMESTAMP_MS);
        const result = await FilterUpdateService.getLastCheckTimeMs();
        expect(result).toBe(SOME_LATER_TIMESTAMP_MS);
    });

    it('does not affect the last update key', async () => {
        await FilterUpdateService.setLastCheckTimeMs(SOME_TIMESTAMP_MS);

        // last update should still be null/unset
        const updateTs = await FilterUpdateService.getLastUpdateTimeMs();
        expect(updateTs).toBeNull();
    });
});
