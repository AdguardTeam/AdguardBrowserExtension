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

import { AssetsFiltersBrowser } from '../../../tools/constants';
import {
    LOCAL_RESOURCES_NONE,
    LOCAL_RESOURCES_OPTION,
    resolveLocalResourcesBrowsers,
} from '../../../tools/resources/mv3';

describe('MV3 local resources options', () => {
    it('updates all MV3 targets without options', () => {
        expect(resolveLocalResourcesBrowsers([])).toEqual([
            AssetsFiltersBrowser.ChromiumMv3,
            AssetsFiltersBrowser.OperaMv3,
            AssetsFiltersBrowser.EdgeMv3,
        ]);
    });

    it('restricts the update to the listed targets', () => {
        expect(resolveLocalResourcesBrowsers(['--local-resources=edge-mv3']))
            .toEqual([AssetsFiltersBrowser.EdgeMv3]);
        expect(resolveLocalResourcesBrowsers(['--local-resources=edge-mv3,chromium-mv3']))
            .toEqual([AssetsFiltersBrowser.EdgeMv3, AssetsFiltersBrowser.ChromiumMv3]);
    });

    it('skips the update entirely with the none value', () => {
        expect(resolveLocalResourcesBrowsers([`${LOCAL_RESOURCES_OPTION}${LOCAL_RESOURCES_NONE}`])).toEqual([]);
    });

    it('accepts the none value with a trailing separator', () => {
        expect(resolveLocalResourcesBrowsers(['--local-resources=none,'])).toEqual([]);
    });

    it('ignores duplicated targets', () => {
        expect(resolveLocalResourcesBrowsers(['--local-resources=edge-mv3,edge-mv3']))
            .toEqual([AssetsFiltersBrowser.EdgeMv3]);
    });

    it('rejects an unsupported target', () => {
        expect(() => resolveLocalResourcesBrowsers(['--local-resources=chrome']))
            .toThrow('Unsupported browsers in --local-resources=chrome: chrome');
    });

    it('rejects an empty target list', () => {
        expect(() => resolveLocalResourcesBrowsers(['--local-resources=']))
            .toThrow('Empty --local-resources=');
    });

    it('rejects a malformed option without the value separator', () => {
        expect(() => resolveLocalResourcesBrowsers(['--local-resources', 'edge-mv3']))
            .toThrow('Malformed --local-resources: expected --local-resources=<browsers|none>');
    });

    it('rejects a repeated option', () => {
        expect(() => resolveLocalResourcesBrowsers(['--local-resources=edge-mv3', '--local-resources=opera-mv3']))
            .toThrow('Duplicate --local-resources option: --local-resources=edge-mv3 --local-resources=opera-mv3');
    });

    it('rejects a malformed occurrence after a valid one', () => {
        expect(() => resolveLocalResourcesBrowsers(['--local-resources=edge-mv3', '--local-resources', 'opera-mv3']))
            .toThrow('Malformed --local-resources: expected --local-resources=<browsers|none>');
    });

    it('rejects the removed skip flag with a migration hint', () => {
        expect(() => resolveLocalResourcesBrowsers(['--skip-local-resources']))
            .toThrow('--skip-local-resources was removed: use --local-resources=none instead');
    });

    it('rejects none combined with targets', () => {
        expect(() => resolveLocalResourcesBrowsers(['--local-resources=none,edge-mv3']))
            .toThrow('none must be the only value of --local-resources=');
    });
});
