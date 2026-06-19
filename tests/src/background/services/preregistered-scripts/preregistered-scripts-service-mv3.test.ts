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

const { mockSyncContentScripts } = vi.hoisted(() => ({
    mockSyncContentScripts: vi.fn(),
}));

vi.mock(
    'tswebextension',
    () => ({
        TsWebExtension: {
            syncContentScripts: mockSyncContentScripts,
        },
    }),
);

vi.mock(
    'preregistered-scripts-registry',
    () => ({
        preregisteredDomainScripts: {
            'youtube.com': ['1', '2', '3', '5'],
            'example.com': ['2', '4'],
        },
    }),
);

const mockLoggerError = vi.fn();
vi.mock(
    '../../../../../Extension/src/common/logger',
    () => ({
        logger: {
            error: (...args: unknown[]) => mockLoggerError(...args),
        },
    }),
);

const { PreregisteredScriptsService } = await import(
    '../../../../../Extension/src/background/services/preregistered-scripts/preregistered-scripts-service-mv3'
);

describe.skipIf(!__IS_MV3__)('PreregisteredScriptsService.sync', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockSyncContentScripts.mockResolvedValue(undefined);
    });

    it('should call syncContentScripts with the correct namespace', async () => {
        await PreregisteredScriptsService.sync([1]);

        expect(mockSyncContentScripts).toHaveBeenCalledWith(
            'preregistered',
            expect.any(Array),
        );
    });

    it('should register only scripts for enabled filter IDs', async () => {
        await PreregisteredScriptsService.sync([1, 2]);

        // youtube.com: filters 1,2,3,5 → only 1,2 enabled → 2 scripts
        // example.com: filters 2,4     → only 2 enabled   → 1 script
        // Total: 3 scripts
        const [, scriptsArg] = mockSyncContentScripts.mock.calls[0]!;
        const scripts = scriptsArg as Array<{ id: string }>;
        expect(scripts).toHaveLength(3);

        const scriptIds = scripts.map((s) => s.id);
        expect(scriptIds).toEqual(expect.arrayContaining([
            'youtube.com_1',
            'youtube.com_2',
            'example.com_2',
        ]));
    });

    it('should pass empty scripts array when no filter is enabled', async () => {
        await PreregisteredScriptsService.sync([99]);

        // Single call with empty scripts array
        expect(mockSyncContentScripts).toHaveBeenCalledTimes(1);

        const [, scriptsArg] = mockSyncContentScripts.mock.calls[0]!;
        expect(scriptsArg).toEqual([]);
    });

    it('should build correct script descriptor shape', async () => {
        await PreregisteredScriptsService.sync([1, 2]);

        const [, scriptsArg] = mockSyncContentScripts.mock.calls[0]!;
        const scripts = scriptsArg as Array<Record<string, unknown>>;

        expect(scripts.length).toBeGreaterThan(0);

        for (const script of scripts) {
            expect(script).toHaveProperty('id');
            expect(script).toHaveProperty('js');
            expect(script).toHaveProperty('matches');
            expect(script).toHaveProperty('runAt');
            expect(script).toHaveProperty('world');
            expect(script).toHaveProperty('persistAcrossSessions');

            expect(script.runAt).toBe('document_start');
            expect(script.world).toBe('MAIN');
            expect(script.persistAcrossSessions).toBe(true);

            // js should be an array with one path
            expect(Array.isArray(script.js)).toBe(true);
            expect((script.js as string[])).toHaveLength(1);
        }
    });

    it('should construct the correct script path', async () => {
        await PreregisteredScriptsService.sync([5]);

        const [, scriptsArg] = mockSyncContentScripts.mock.calls[0]!;
        const scripts = scriptsArg as Array<{ id: string; js: string[] }>;

        const script = scripts.find((s) => s.id.includes('youtube.com'));
        expect(script).toBeDefined();
        expect(script!.js[0]).toBe('filters/preregistered-scripts/youtube.com-5.js');
    });

    it('should construct the correct match patterns', async () => {
        await PreregisteredScriptsService.sync([1]);

        const [, scriptsArg] = mockSyncContentScripts.mock.calls[0]!;
        const scripts = scriptsArg as Array<{ id: string; matches: string[] }>;

        const script = scripts.find((s) => s.id.includes('youtube.com'));
        expect(script).toBeDefined();
        expect(script!.matches).toEqual([
            '*://youtube.com/*',
            '*://*.youtube.com/*',
        ]);
    });

    it('should handle an empty enabled filter list gracefully', async () => {
        await PreregisteredScriptsService.sync([]);

        expect(mockSyncContentScripts).toHaveBeenCalledTimes(1);

        const [, scriptsArg] = mockSyncContentScripts.mock.calls[0]!;
        expect(scriptsArg).toEqual([]);
        expect(mockLoggerError).not.toHaveBeenCalled();
    });

    it('should handle all filters enabled', async () => {
        await PreregisteredScriptsService.sync([1, 2, 3, 4, 5]);

        const [, scriptsArg] = mockSyncContentScripts.mock.calls[0]!;
        const scripts = scriptsArg as Array<{ id: string }>;

        // youtube.com has filters 1,2,3,5 → 4 scripts
        // example.com has filters 2,4     → 2 scripts
        // Total: 6 scripts
        expect(scripts).toHaveLength(6);

        const scriptIds = scripts.map((s) => s.id);
        expect(scriptIds).toEqual(expect.arrayContaining([
            'youtube.com_1',
            'youtube.com_2',
            'youtube.com_3',
            'youtube.com_5',
            'example.com_2',
            'example.com_4',
        ]));
    });

    it('should pass number filter IDs and correctly convert them to strings for lookup', async () => {
        // Even though the registry uses strings, the service receives numbers
        await PreregisteredScriptsService.sync([1]);

        const [, scriptsArg] = mockSyncContentScripts.mock.calls[0]!;
        const scripts = scriptsArg as Array<{ id: string }>;

        // Filter 1 should match the string "1" in the registry
        const script = scripts.find((s) => s.id.includes('youtube.com'));
        expect(script).toBeDefined();
        expect(script!.id).toBe('youtube.com_1');
    });

    it('should include scripts from all domains when the same filter appears for different domains', async () => {
        await PreregisteredScriptsService.sync([2]);

        // Filter 2 exists in both youtube.com and example.com
        expect(mockSyncContentScripts).toHaveBeenCalledTimes(1);

        const [, scriptsArg] = mockSyncContentScripts.mock.calls[0]!;
        const scripts = scriptsArg as Array<{ id: string }>;

        // Both domains should have their own registration for filter 2
        expect(scripts).toHaveLength(2);

        const scriptIds = scripts.map((s) => s.id);
        expect(scriptIds).toEqual(expect.arrayContaining([
            'youtube.com_2',
            'example.com_2',
        ]));
    });

    it('should call syncContentScripts exactly once with all domains scripts combined', async () => {
        await PreregisteredScriptsService.sync([1, 2, 3, 4, 5]);

        // The namespace is shared — calling syncContentScripts once per domain
        // would cause each subsequent call to unregister the previous domain's
        // scripts (ContentScriptManager.sync does a full reconciliation).
        // Therefore syncContentScripts must be called exactly once with all
        // scripts across all domains.
        expect(mockSyncContentScripts).toHaveBeenCalledTimes(1);

        const [namespaceArg, scriptsArg] = mockSyncContentScripts.mock.calls[0]!;
        expect(namespaceArg).toBe('preregistered');

        const scripts = scriptsArg as Array<{ id: string }>;

        // youtube.com: filters 1,2,3,5 → 4 scripts
        // example.com: filters 2,4     → 2 scripts
        // Total: 6 scripts from both domains
        expect(scripts).toHaveLength(6);

        // All expected IDs from both domains must be present.
        // ContentScriptManager expects IDs without the namespace prefix
        // (it adds the prefix internally), so the descriptor IDs omit
        // the 'preregistered_' portion.
        const scriptIds = scripts.map((s) => s.id);
        expect(scriptIds).toEqual(expect.arrayContaining([
            'youtube.com_1',
            'youtube.com_2',
            'youtube.com_3',
            'youtube.com_5',
            'example.com_2',
            'example.com_4',
        ]));
    });

    it('should log error when syncContentScripts throws', async () => {
        mockSyncContentScripts.mockRejectedValue(new Error('API failure'));

        await PreregisteredScriptsService.sync([1]);

        expect(mockLoggerError).toHaveBeenCalledWith(
            expect.stringContaining('Failed to sync preregistered scripts'),
            expect.any(Error),
        );
    });
});
