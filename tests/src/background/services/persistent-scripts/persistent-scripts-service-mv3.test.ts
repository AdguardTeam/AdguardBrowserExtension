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
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

import {
    PersistentScriptsService,
} from '../../../../../Extension/src/background/services/persistent-scripts/persistent-scripts-service-mv3';

// Mock chrome.scripting API
const mockGetRegistered = vi.fn();
const mockRegister = vi.fn();
const mockUnregister = vi.fn();

vi.stubGlobal('chrome', {
    scripting: {
        getRegisteredContentScripts: mockGetRegistered,
        registerContentScripts: mockRegister,
        unregisterContentScripts: mockUnregister,
    },
});

// Mock the registry import — simplified key-value format
vi.mock(
    'critical-scripts-registry',
    () => ({
        criticalDomainScripts: {
            'youtube.com': ['2', '5'],
        },
    }),
);

// Mock the logger
vi.mock('../../../../../Extension/src/common/logger', () => ({
    logger: {
        debug: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
    },
}));

describe('PersistentScriptsService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('sync', () => {
        it('registers scripts for enabled filters that are not yet registered', async () => {
            mockGetRegistered.mockResolvedValue([]);

            await PersistentScriptsService.sync([2]);

            expect(mockRegister).toHaveBeenCalledTimes(1);
            const registered = mockRegister.mock.calls[0]![0]!;
            expect(registered).toHaveLength(1);
            expect(registered[0].id).toBe('critical_youtube.com_2');
            expect(registered[0].js).toEqual(['filters/critical-scripts/youtube.com-2.js']);
            expect(registered[0].matches).toEqual(['*://youtube.com/*', '*://*.youtube.com/*']);
            expect(registered[0].runAt).toBe('document_start');
            expect(registered[0].world).toBe('MAIN');
            expect(registered[0].persistAcrossSessions).toBe(true);
        });

        it('registers scripts for multiple enabled filters', async () => {
            mockGetRegistered.mockResolvedValue([]);

            await PersistentScriptsService.sync([2, 5]);

            expect(mockRegister).toHaveBeenCalledTimes(1);
            const registered = mockRegister.mock.calls[0]![0]!;
            expect(registered).toHaveLength(2);
            const ids = registered.map((r: { id: string }) => r.id);
            expect(ids).toContain('critical_youtube.com_2');
            expect(ids).toContain('critical_youtube.com_5');
        });

        it('does not register scripts for disabled filters', async () => {
            mockGetRegistered.mockResolvedValue([]);

            await PersistentScriptsService.sync([2]);

            const registered = mockRegister.mock.calls[0]![0]!;
            const ids = registered.map((r: { id: string }) => r.id);
            expect(ids).not.toContain('critical_youtube.com_5');
        });

        it('unregisters scripts for filters that are no longer enabled', async () => {
            mockGetRegistered.mockResolvedValue([
                { id: 'critical_youtube.com_2' },
                { id: 'critical_youtube.com_5' },
            ]);

            // Only filter 2 is enabled — filter 5 should be unregistered
            await PersistentScriptsService.sync([2]);

            expect(mockUnregister).toHaveBeenCalledWith({
                ids: ['critical_youtube.com_5'],
            });
            expect(mockRegister).not.toHaveBeenCalled();
        });

        it('leaves already-correct registrations untouched', async () => {
            mockGetRegistered.mockResolvedValue([
                { id: 'critical_youtube.com_2' },
            ]);

            await PersistentScriptsService.sync([2]);

            expect(mockRegister).not.toHaveBeenCalled();
            expect(mockUnregister).not.toHaveBeenCalled();
        });

        it('cleans up stale old-format script IDs', async () => {
            mockGetRegistered.mockResolvedValue([
                { id: 'critical_youtube.com' }, // old format — no filterId suffix
                { id: 'critical_youtube.com_2' },
            ]);

            await PersistentScriptsService.sync([2]);

            // Old-format ID should be removed
            expect(mockUnregister).toHaveBeenCalledWith({
                ids: ['critical_youtube.com'],
            });
        });

        it('does not touch registrations not starting with critical_ prefix', async () => {
            mockGetRegistered.mockResolvedValue([
                { id: 'some_other_script' },
                { id: 'critical_youtube.com_2' },
            ]);

            await PersistentScriptsService.sync([2]);

            // Only ids with the prefix are considered for removal
            const unregisterCall = mockUnregister.mock.calls[0]?.[0];
            if (unregisterCall) {
                expect(unregisterCall.ids).not.toContain('some_other_script');
            }
        });

        it('handles empty enabled filter list — unregisters everything', async () => {
            mockGetRegistered.mockResolvedValue([
                { id: 'critical_youtube.com_2' },
                { id: 'critical_youtube.com_5' },
            ]);

            await PersistentScriptsService.sync([]);

            expect(mockUnregister).toHaveBeenCalledWith({
                ids: ['critical_youtube.com_2', 'critical_youtube.com_5'],
            });
            expect(mockRegister).not.toHaveBeenCalled();
        });
    });
});
