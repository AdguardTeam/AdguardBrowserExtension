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
    afterEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

import { AssetsLoader } from '@adguard/dnr-rulesets';

import { AssetsFiltersBrowser, MV3_ASSETS_FILTERS_BROWSER_TO_DNR_BROWSER_MAP } from '../../../tools/constants';
import { downloadAndPrepareMv3Filters } from '../../../tools/resources/download-filters';

afterEach(() => {
    vi.restoreAllMocks();
});

describe('Edge MV3 resource preparation', () => {
    it.each([false, true])('loads Edge resources with onlyDeclarativeRulesets=%s', async (onlyDeclarativeRulesets) => {
        const load = vi.spyOn(AssetsLoader.prototype, 'load').mockResolvedValue();
        await downloadAndPrepareMv3Filters(AssetsFiltersBrowser.EdgeMv3, onlyDeclarativeRulesets);
        expect(load).toHaveBeenCalledExactlyOnceWith('Extension/filters/edge-mv3', {
            browser: 'edge-mv3',
            onlyDeclarativeRulesets,
        });
    });

    it('rejects a package without Edge support before the loader can default to Chromium', async () => {
        const load = vi.spyOn(AssetsLoader.prototype, 'load').mockResolvedValue();
        const mapping = MV3_ASSETS_FILTERS_BROWSER_TO_DNR_BROWSER_MAP;
        const edgeBrowser = mapping[AssetsFiltersBrowser.EdgeMv3];
        Reflect.deleteProperty(mapping, AssetsFiltersBrowser.EdgeMv3);
        try {
            await expect(downloadAndPrepareMv3Filters(AssetsFiltersBrowser.EdgeMv3))
                .rejects.toThrow('does not support edge-mv3');
            expect(load).not.toHaveBeenCalled();
        } finally {
            mapping[AssetsFiltersBrowser.EdgeMv3] = edgeBrowser;
        }
    });
});
