/**
 * Copyright (c) 2015-2026 Adguard Software Ltd.
 *
 * @file Unit tests for E2E page recovery helpers: diagnostics collection,
 * selector reload retry, and the failure wrapper.
 *
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

import { MessageType } from '../../../Extension/src/common/messages/constants';
import { type E2EPageHandle } from '../../../tools/browser-test/e2e/page-handle';
import { E2ESurfaceId, type E2EError } from '../../../tools/browser-test/e2e/types';

import {
    DIAGNOSTICS_DUMP_TIMEOUT_MS,
    collectPageDiagnostics,
    waitForSelectorWithRecovery,
    withDiagnosticsOnFailure,
} from './page-recovery-helpers';

vi.mock('../../../tools/browser-test/logger', () => ({
    logError: vi.fn(),
    logInfo: vi.fn(),
}));

/**
 * Creates an E2E error record for diagnostics assertions.
 *
 * @param message Error message.
 *
 * @returns E2E error record.
 */
const createError = (message: string): E2EError => ({
    matrixId: 'test-matrix',
    surfaceId: E2ESurfaceId.Popup,
    source: 'test-source',
    message,
    url: 'chrome-extension://test/pages/popup.html',
    timestamp: '2026-01-01T00:00:00.000Z',
});

/**
 * Creates an error that mimics an engine selector-wait timeout. Both Playwright
 * and Selenium name their timeout errors `TimeoutError`.
 *
 * @param message Error message.
 *
 * @returns Timeout error.
 */
const createTimeoutError = (message: string): Error => {
    const error = new Error(message);
    error.name = 'TimeoutError';
    return error;
};

/**
 * Creates an `evaluate` mock that resolves consecutive calls with the given values.
 *
 * @param results Values returned by consecutive `evaluate` calls.
 *
 * @returns Page handle `evaluate` mock.
 */
const createEvaluateMock = (results: unknown[]): E2EPageHandle['evaluate'] => {
    const mock = vi.fn();

    results.forEach((result) => mock.mockResolvedValueOnce(result));

    return mock as unknown as E2EPageHandle['evaluate'];
};

/**
 * Creates a page handle test double with overridable behavior.
 *
 * @param overrides Methods to override.
 *
 * @returns Page handle test double.
 */
const createPageHandle = (overrides: Partial<E2EPageHandle> = {}): E2EPageHandle => ({
    querySelectorCount: vi.fn(async () => 0),
    waitForSelector: vi.fn(async () => {}),
    getErrors: vi.fn(async () => []),
    getBackgroundErrors: vi.fn(async () => []),
    clickSelector: vi.fn(async () => {}),
    typeText: vi.fn(async () => {}),
    evaluate: vi.fn(async () => '') as unknown as E2EPageHandle['evaluate'],
    getTextContents: vi.fn(async () => []),
    reload: vi.fn(async () => {}),
    close: vi.fn(async () => {}),
    ...overrides,
});

describe('collectPageDiagnostics', () => {
    it('collects URL, DOM state, background probe, page errors and background errors', async () => {
        const pageErrors = [createError('page error')];
        const backgroundErrors = [createError('background error')];
        const page = createPageHandle({
            evaluate: createEvaluateMock([
                'chrome-extension://test/pages/popup.html',
                '<html><body>popup</body></html>',
                { result: 'response', response: false, lastError: null },
            ]),
            getErrors: async () => pageErrors,
            getBackgroundErrors: async () => backgroundErrors,
        });

        await expect(collectPageDiagnostics(page)).resolves.toEqual({
            url: 'chrome-extension://test/pages/popup.html',
            domState: '<html><body>popup</body></html>',
            backgroundProbe: { result: 'response', response: false, lastError: null },
            pageErrors,
            backgroundErrors,
        });
    });

    it('probes the background with GetIsAppInitialized and records the response', async () => {
        const sendMessage = vi.fn((_message: unknown, callback: (response: unknown) => void) => {
            callback(false);
        });
        vi.stubGlobal('chrome', { runtime: { sendMessage } });

        try {
            const evaluate = vi.fn(
                async (fn: (arg: unknown) => unknown, arg?: unknown) => fn(arg),
            ) as unknown as E2EPageHandle['evaluate'];
            const page = createPageHandle({ evaluate });

            const diagnostics = await collectPageDiagnostics(page);

            expect(sendMessage).toHaveBeenCalledWith(
                { handlerName: 'app', type: MessageType.GetIsAppInitialized },
                expect.any(Function),
            );
            expect(diagnostics.backgroundProbe).toEqual({ result: 'response', response: false, lastError: null });
        } finally {
            vi.unstubAllGlobals();
        }
    });

    it('strips style and script payloads so the rendered body survives the snapshot budget', async () => {
        document.head.innerHTML = `<style>${'.payload{color:red}'.repeat(2000)}</style>`;
        document.body.innerHTML = '<button role="switch"></button><script>window.payload = "secret";</script>';

        const evaluate = vi.fn(async (fn: (arg: unknown) => unknown, arg?: unknown) => {
            // Short-circuit the background probe: this test exercises the DOM
            // snapshot callback against the jsdom document.
            if (arg && typeof arg === 'object' && 'type' in arg) {
                return { result: 'response', response: true };
            }

            return fn(arg);
        }) as unknown as E2EPageHandle['evaluate'];
        const page = createPageHandle({ evaluate });

        const diagnostics = await collectPageDiagnostics(page);

        expect(diagnostics.domState).toContain('<button role="switch"></button>');
        expect(diagnostics.domState).not.toContain('.payload');
        expect(diagnostics.domState).not.toContain('window.payload');
        expect(diagnostics.domState).not.toContain('truncated');
    });

    it('records probe failures without throwing', async () => {
        const failingEvaluate = vi.fn()
            .mockRejectedValue(new Error('page is gone')) as unknown as E2EPageHandle['evaluate'];
        const page = createPageHandle({
            evaluate: failingEvaluate,
            getErrors: async () => {
                throw new Error('page collector unavailable');
            },
            getBackgroundErrors: async () => {
                throw new Error('background collector unavailable');
            },
        });

        const diagnostics = await collectPageDiagnostics(page);

        expect(diagnostics.url).toBe('failed to read URL: page is gone');
        expect(diagnostics.domState).toBe('failed to read DOM: page is gone');
        expect(diagnostics.backgroundProbe).toBe('failed to probe background: page is gone');
        expect(diagnostics.pageErrors).toBe('failed to collect page errors: page collector unavailable');
        expect(diagnostics.backgroundErrors)
            .toBe('failed to collect background errors: background collector unavailable');
    });

    it('bounds the whole dump when every probe hangs', async () => {
        vi.useFakeTimers();

        try {
            const hang = (): Promise<unknown> => new Promise(() => {});
            const page = createPageHandle({
                evaluate: vi.fn(hang) as unknown as E2EPageHandle['evaluate'],
                getErrors: vi.fn(hang) as unknown as E2EPageHandle['getErrors'],
                getBackgroundErrors: vi.fn(hang) as unknown as E2EPageHandle['getBackgroundErrors'],
            });

            const diagnosticsPromise = collectPageDiagnostics(page);
            await vi.advanceTimersByTimeAsync(DIAGNOSTICS_DUMP_TIMEOUT_MS);
            const diagnostics = await diagnosticsPromise;

            expect(diagnostics.url).toContain('diagnostics probe timed out');
            expect(diagnostics.domState).toContain('diagnostics probe timed out');
            expect(diagnostics.backgroundProbe).toContain('diagnostics probe timed out');
            // The probes that start once the shared deadline is reached are
            // recorded as a dump timeout instead of getting another slice.
            expect(diagnostics.pageErrors).toContain('diagnostics dump timed out');
            expect(diagnostics.backgroundErrors).toContain('diagnostics dump timed out');
        } finally {
            vi.useRealTimers();
        }
    });

    it('truncates long DOM snapshots', async () => {
        const longDom = 'a'.repeat(25_000);
        const page = createPageHandle({
            evaluate: createEvaluateMock([
                'chrome-extension://test/pages/popup.html',
                longDom,
            ]),
        });

        const diagnostics = await collectPageDiagnostics(page);

        expect(diagnostics.domState).toBe(`${'a'.repeat(20_000)}…[truncated 5000 chars]`);
    });
});

describe('waitForSelectorWithRecovery', () => {
    it('returns without reloading when the selector appears', async () => {
        const waitForSelector = vi.fn(async () => {});
        const reload = vi.fn(async () => {});
        const page = createPageHandle({ waitForSelector, reload });

        await waitForSelectorWithRecovery(page, 'button[role="switch"]', {
            timeoutMs: 1000,
            reloadTimeoutMs: 500,
            retryTimeoutMs: 1000,
            context: 'test/popup',
        });

        expect(waitForSelector).toHaveBeenCalledTimes(1);
        expect(waitForSelector).toHaveBeenCalledWith('button[role="switch"]', 1000);
        expect(reload).not.toHaveBeenCalled();
    });

    it('reloads once and retries when the first wait times out', async () => {
        const waitForSelector = vi.fn()
            .mockRejectedValueOnce(createTimeoutError('Timeout 1000ms exceeded'))
            .mockResolvedValueOnce(undefined);
        const reload = vi.fn(async () => {});
        const getErrors = vi.fn(async () => []);
        const page = createPageHandle({ waitForSelector, reload, getErrors });

        await waitForSelectorWithRecovery(page, 'button[role="switch"]', {
            timeoutMs: 1000,
            reloadTimeoutMs: 250,
            retryTimeoutMs: 500,
            context: 'test/popup',
        });

        expect(reload).toHaveBeenCalledTimes(1);
        expect(reload).toHaveBeenCalledWith(250);
        expect(waitForSelector).toHaveBeenNthCalledWith(2, 'button[role="switch"]', 500);
        expect(getErrors).toHaveBeenCalledTimes(1);
    });

    it('dumps diagnostics and rethrows without reloading on a non-timeout failure', async () => {
        const failure = new Error('Target closed');
        const waitForSelector = vi.fn(async () => {
            throw failure;
        });
        const reload = vi.fn(async () => {});
        const getErrors = vi.fn(async () => []);
        const page = createPageHandle({ waitForSelector, reload, getErrors });

        await expect(waitForSelectorWithRecovery(page, 'button[role="switch"]', {
            timeoutMs: 1000,
            reloadTimeoutMs: 250,
            retryTimeoutMs: 500,
            context: 'test/popup',
        })).rejects.toThrow(failure);

        expect(reload).not.toHaveBeenCalled();
        expect(waitForSelector).toHaveBeenCalledTimes(1);
        expect(getErrors).toHaveBeenCalledTimes(1);
    });

    it('dumps diagnostics again and rethrows the retry error when the retry also times out', async () => {
        const firstTimeoutError = createTimeoutError('Timeout 1000ms exceeded');
        const retryTimeoutError = createTimeoutError('Timeout 500ms exceeded after reload');
        const waitForSelector = vi.fn()
            .mockRejectedValueOnce(firstTimeoutError)
            .mockRejectedValueOnce(retryTimeoutError);
        const reload = vi.fn(async () => {});
        const getErrors = vi.fn(async () => []);
        const page = createPageHandle({ waitForSelector, reload, getErrors });

        await expect(waitForSelectorWithRecovery(page, 'button[role="switch"]', {
            timeoutMs: 1000,
            reloadTimeoutMs: 250,
            retryTimeoutMs: 500,
            context: 'test/popup',
        })).rejects.toThrow(retryTimeoutError);

        expect(reload).toHaveBeenCalledTimes(1);
        expect(getErrors).toHaveBeenCalledTimes(2);
    });

    it('keeps the selector timeout context when the recovery reload fails', async () => {
        const reloadError = new Error('Navigation failed');
        const waitForSelector = vi.fn(async () => {
            throw createTimeoutError('Timeout 1000ms exceeded');
        });
        const reload = vi.fn(async () => {
            throw reloadError;
        });
        const getErrors = vi.fn(async () => []);
        const page = createPageHandle({ waitForSelector, reload, getErrors });

        const error = await waitForSelectorWithRecovery(page, 'button[role="switch"]', {
            timeoutMs: 1000,
            reloadTimeoutMs: 250,
            retryTimeoutMs: 500,
            context: 'test/popup',
        }).catch((thrown: unknown) => thrown);

        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('timed out and the recovery reload failed');
        expect((error as Error).message).toContain(reloadError.message);
        expect((error as Error).cause).toBe(reloadError);
        expect(waitForSelector).toHaveBeenCalledTimes(1);
        // Pre-reload diagnostics and reload-failure diagnostics.
        expect(getErrors).toHaveBeenCalledTimes(2);
    });
});

describe('withDiagnosticsOnFailure', () => {
    it('returns the step result without dumping diagnostics on success', async () => {
        const getErrors = vi.fn(async () => []);
        const page = createPageHandle({ getErrors });

        await expect(withDiagnosticsOnFailure(page, 'test/popup', async () => 'ok')).resolves.toBe('ok');

        expect(getErrors).not.toHaveBeenCalled();
    });

    it('dumps diagnostics and rethrows when the step fails', async () => {
        const failure = new Error('assertion failed');
        const getErrors = vi.fn(async () => []);
        const page = createPageHandle({ getErrors });

        await expect(withDiagnosticsOnFailure(page, 'test/popup', async () => {
            throw failure;
        })).rejects.toThrow(failure);

        expect(getErrors).toHaveBeenCalledTimes(1);
    });

    it('does not dump diagnostics again for an error the recovery wait already dumped', async () => {
        const waitForSelector = vi.fn()
            .mockRejectedValueOnce(createTimeoutError('Timeout 1000ms exceeded'))
            .mockRejectedValueOnce(createTimeoutError('Timeout 500ms exceeded after reload'));
        const reload = vi.fn(async () => {});
        const getErrors = vi.fn(async () => []);
        const page = createPageHandle({ waitForSelector, reload, getErrors });

        await expect(withDiagnosticsOnFailure(page, 'test/popup', async () => {
            await waitForSelectorWithRecovery(page, 'button[role="switch"]', {
                timeoutMs: 1000,
                reloadTimeoutMs: 250,
                retryTimeoutMs: 500,
                context: 'test/popup',
            });
        })).rejects.toThrow('Timeout 500ms exceeded after reload');

        // Pre-reload and post-reload dumps only: the wrapper must not repeat them.
        expect(getErrors).toHaveBeenCalledTimes(2);
    });
});
