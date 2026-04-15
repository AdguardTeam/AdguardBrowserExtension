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

import fs from 'node:fs';

import {
    describe,
    it,
    expect,
    vi,
    beforeEach,
} from 'vitest';
import axios from 'axios';

import { getAllDownloadTasks, downloadAllFilters } from '../../../tools/resources/download-filters';

vi.mock('axios');
vi.mock('fs-extra');
vi.mock('node:fs', async (importOriginal) => {
    const actual = await importOriginal() as Record<string, unknown>;
    const promises = (actual as { promises: Record<string, unknown> }).promises;
    return {
        ...actual,
        default: {
            ...actual,
            promises: {
                ...promises,
                writeFile: vi.fn().mockResolvedValue(undefined),
            },
        },
    };
});
vi.mock('cli-progress', () => {
    const mockBar = {
        start: vi.fn(),
        increment: vi.fn(),
        stop: vi.fn(),
    };
    return {
        default: {
            SingleBar: vi.fn(() => mockBar),
        },
    };
});
vi.mock('../../../tools/cli-log', () => ({
    cliLog: {
        info: vi.fn(),
        error: vi.fn((msg: string) => {
            throw new Error(msg);
        }),
        success: vi.fn(),
        warning: vi.fn(),
        warningRed: vi.fn(),
    },
}));

const mockedAxiosGet = vi.fn<typeof axios.get>();
// @ts-expect-error — replace axios.get with a vi.fn() for proper mock typing
axios.get = mockedAxiosGet;

describe('getAllDownloadTasks', () => {
    it('returns tasks for all 4 browsers', () => {
        const tasks = getAllDownloadTasks();
        // 4 browsers × (2 metadata + 21 filters + 21 optimized) = 4 × 44 = 176
        expect(tasks.length).toBe(176);
    });

    it('each task has url, fileName, and browser', () => {
        const tasks = getAllDownloadTasks();
        for (const task of tasks) {
            expect(task.url).toBeTruthy();
            expect(task.fileName).toBeTruthy();
            expect(task.browser).toBeTruthy();
        }
    });

    it('includes all expected browsers', () => {
        const tasks = getAllDownloadTasks();
        const browsers = new Set(tasks.map((t) => t.browser));
        expect(browsers).toEqual(new Set(['chromium', 'edge', 'firefox', 'opera']));
    });

    it('metadata tasks do not have validate flag', () => {
        const tasks = getAllDownloadTasks();
        const metaTasks = tasks.filter((t) => t.fileName.endsWith('.json'));
        for (const task of metaTasks) {
            expect(task.validate).toBeFalsy();
        }
    });

    it('filter tasks have validate flag set to true', () => {
        const tasks = getAllDownloadTasks();
        const filterTasks = tasks.filter((t) => t.fileName.endsWith('.txt'));
        for (const task of filterTasks) {
            expect(task.validate).toBe(true);
        }
    });
});

describe('downloadAllFilters', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        mockedAxiosGet.mockResolvedValue({
            data: Buffer.from('! Checksum: test\n! Title: Test\n||example.com^\n'),
        } as never);
    });

    it('downloads all files and returns total count', async () => {
        // Use a valid checksum so validation passes
        const body = '! Title: Test\n||example.com^\n';
        const { calculateChecksum } = await import('../../../tools/utils/checksum');
        const checksum = calculateChecksum(body);
        const content = `! Checksum: ${checksum}\n${body}`;

        mockedAxiosGet.mockResolvedValue({
            data: Buffer.from(content),
        } as never);

        const count = await downloadAllFilters();
        expect(count).toBe(176);
        expect(mockedAxiosGet).toHaveBeenCalledTimes(176);
    });

    it('passes timeout to axios requests', async () => {
        const body = '! Title: Test\n||example.com^\n';
        const { calculateChecksum } = await import('../../../tools/utils/checksum');
        const checksum = calculateChecksum(body);
        const content = `! Checksum: ${checksum}\n${body}`;

        mockedAxiosGet.mockResolvedValue({
            data: Buffer.from(content),
        } as never);

        await downloadAllFilters();

        const firstCall = mockedAxiosGet.mock.calls[0];
        expect(firstCall?.[1]).toEqual(
            expect.objectContaining({ timeout: 30_000 }),
        );
    });

    it('writes files to disk', async () => {
        const body = '! Title: Test\n||example.com^\n';
        const { calculateChecksum } = await import('../../../tools/utils/checksum');
        const checksum = calculateChecksum(body);
        const content = `! Checksum: ${checksum}\n${body}`;

        mockedAxiosGet.mockResolvedValue({
            data: Buffer.from(content),
        } as never);

        await downloadAllFilters();

        expect(fs.promises.writeFile).toHaveBeenCalledTimes(176);
    });

    it('fails fast when a download throws', async () => {
        const networkError = new Error('ECONNREFUSED');

        // First call succeeds, second throws
        mockedAxiosGet
            .mockResolvedValueOnce({ data: Buffer.from('metadata') } as never)
            .mockRejectedValueOnce(networkError)
            .mockResolvedValue({ data: Buffer.from('other') } as never);

        await expect(downloadAllFilters(1)).rejects.toThrow('ECONNREFUSED');

        // With concurrency 1, should stop after the error
        // (first succeeds, second fails, no more should run)
        expect(mockedAxiosGet.mock.calls.length).toBeLessThan(176);
    });

    it('fails fast on checksum mismatch', async () => {
        // Content with bad checksum — validate=true tasks will fail
        const contentWithBadChecksum = Buffer.from('! Checksum: BADCHECKSUM\n! Title: Test\n||example.com^\n');

        // Metadata tasks (no validate) succeed, filter tasks fail
        mockedAxiosGet.mockResolvedValue({
            data: contentWithBadChecksum,
        } as never);

        // Should reject because cliLog.error throws
        await expect(downloadAllFilters(1)).rejects.toThrow('Wrong checksum');
    });

    it('respects concurrency limit', async () => {
        let maxConcurrent = 0;
        let currentConcurrent = 0;

        const body = '! Title: Test\n||example.com^\n';
        const { calculateChecksum } = await import('../../../tools/utils/checksum');
        const checksum = calculateChecksum(body);
        const content = `! Checksum: ${checksum}\n${body}`;

        mockedAxiosGet.mockImplementation((async () => {
            currentConcurrent += 1;
            maxConcurrent = Math.max(maxConcurrent, currentConcurrent);
            // Simulate async delay
            await new Promise((resolve) => {
                setTimeout(resolve, 1);
            });
            currentConcurrent -= 1;
            return { data: Buffer.from(content) };
        }) as never);

        await downloadAllFilters(5);

        expect(maxConcurrent).toBeLessThanOrEqual(5);
        expect(maxConcurrent).toBeGreaterThan(1);
    });
});
