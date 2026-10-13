/**
 * Copyright (c) 2015-2026 Adguard Software Ltd.
 *
 * @file Shared E2E helpers for recovering from stalled pages and collecting failure diagnostics.
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

import { APP_MESSAGE_HANDLER_NAME, MessageType } from '../../../Extension/src/common/messages/constants';
import { logError, logInfo } from '../../../tools/browser-test/logger';
import { type E2EPageHandle } from '../../../tools/browser-test/e2e/page-handle';
import { type E2EError } from '../../../tools/browser-test/e2e/types';
import { withTimeout } from '../../../tools/browser-test/e2e/with-timeout';

/**
 * Maximum number of DOM characters included in a diagnostics snapshot.
 */
const DOM_SNAPSHOT_MAX_LENGTH = 20_000;

/**
 * Timeout for waiting for a DOM element to appear, in milliseconds. Large
 * rulesets and MV3 service-worker cold starts can keep a page from becoming
 * interactive on slow CI hosts.
 */
export const SELECTOR_WAIT_TIMEOUT_MS = 60_000;

/**
 * Timeout for the selector retry after the recovery reload, in milliseconds.
 */
export const SELECTOR_RETRY_TIMEOUT_MS = 30_000;

/**
 * Timeout for the recovery reload, in milliseconds. Bounds the reload so the
 * worst case of one recovery wait is `SELECTOR_WAIT_TIMEOUT_MS +
 * SELECTOR_RELOAD_TIMEOUT_MS + SELECTOR_RETRY_TIMEOUT_MS`.
 */
export const SELECTOR_RELOAD_TIMEOUT_MS = 15_000;

/**
 * Worst-case wall-clock budget for one recovery wait: the first selector
 * attempt, the bounded recovery reload and the retry attempt.
 */
export const SELECTOR_RECOVERY_BUDGET_MS = SELECTOR_WAIT_TIMEOUT_MS
    + SELECTOR_RELOAD_TIMEOUT_MS
    + SELECTOR_RETRY_TIMEOUT_MS;

/**
 * Maximum time to wait for one diagnostics probe, in milliseconds. Probes run
 * against a page that may be unresponsive, and Playwright's `evaluate` has no
 * timeout of its own, so an unbounded probe could block the dump until the
 * Vitest timeout and skip the diagnostics entirely.
 */
const DIAGNOSTICS_PROBE_TIMEOUT_MS = 5_000;

/**
 * Timeout for the in-page background message probe, in milliseconds. Kept
 * below `DIAGNOSTICS_PROBE_TIMEOUT_MS` so a background that never answers is
 * recorded as a `timeout` result instead of an outer probe failure.
 */
const BACKGROUND_PROBE_TIMEOUT_MS = 3_000;

/**
 * Maximum time for a whole diagnostics dump, in milliseconds. Individual
 * probes are bounded by `DIAGNOSTICS_PROBE_TIMEOUT_MS`, and this shared
 * deadline keeps a dump with several unresponsive probes from overrunning the
 * per-test timeout. E2E test budgets count it as a margin per expected dump.
 */
export const DIAGNOSTICS_DUMP_TIMEOUT_MS = 15_000;

/**
 * How an in-page background message probe settled.
 */
export type E2EBackgroundProbeResult = 'response' | 'timeout' | 'rejected' | 'threw' | 'unavailable';

/**
 * Result of an in-page background message probe.
 */
export type E2EBackgroundProbe = {
    /**
     * How the probe settled.
     */
    result: E2EBackgroundProbeResult;

    /**
     * Response returned by the background, when it answered.
     */
    response?: unknown;

    /**
     * `chrome.runtime.lastError.message` read inside the message callback,
     * when the runtime set one.
     */
    lastError?: string | null;

    /**
     * Error description for `rejected` and `threw` results.
     */
    error?: string;
};

/**
 * Minimal browser runtime surface used by the in-page background probe.
 */
type BackgroundRuntime = {
    /**
     * Last error recorded by the runtime for a failed message call.
     */
    lastError?: { message?: string };

    /**
     * Sends a message to the extension background.
     */
    sendMessage: (
        message: unknown,
        callback: (response: unknown) => void,
    ) => Promise<unknown> | undefined;
};

/**
 * Diagnostic snapshot of an E2E page, collected on test failure.
 */
export type E2EPageDiagnostics = {
    /**
     * Current page URL, or a probe failure description.
     */
    url: string;

    /**
     * Truncated DOM snapshot (`document.documentElement.outerHTML` with
     * `<style>` and `<script>` payloads removed), or a probe failure
     * description.
     */
    domState: string;

    /**
     * Result of a direct `GetIsAppInitialized` message probe from the page, or
     * a probe failure description. Distinguishes a background that never
     * answers (`timeout`) from one that answers `false` while the app is still
     * initializing.
     */
    backgroundProbe: E2EBackgroundProbe | string;

    /**
     * Collected page errors, or a probe failure description.
     */
    pageErrors: E2EError[] | string;

    /**
     * Collected background errors, or a probe failure description.
     */
    backgroundErrors: E2EError[] | string;
};

/**
 * Errors whose diagnostics were already dumped, so an outer wrapper does not
 * dump the same stalled page again.
 */
const dumpedErrors = new WeakSet<Error>();

/**
 * Options for `waitForSelectorWithRecovery`.
 */
export type WaitForSelectorWithRecoveryOptions = {
    /**
     * Maximum time to wait for the selector on the first attempt, in
     * milliseconds.
     */
    timeoutMs: number;

    /**
     * Timeout for the retry attempt after the page reload, in milliseconds.
     * Kept separate from `timeoutMs` so the recovery flow fits into the
     * Vitest `testTimeout`.
     */
    retryTimeoutMs: number;

    /**
     * Timeout for the recovery reload, in milliseconds. Bounds the reload so
     * the worst case of one recovery wait is `timeoutMs + reloadTimeoutMs +
     * retryTimeoutMs`.
     */
    reloadTimeoutMs: number;

    /**
     * Human-readable label for logs, for example `chrome-mv3/popup`.
     */
    context: string;
};

/**
 * Formats a thrown value for diagnostics output.
 *
 * @param error Thrown value.
 *
 * @returns Error message.
 */
const formatError = (error: unknown): string => (error instanceof Error ? error.message : String(error));

/**
 * Checks whether a thrown value is a selector-wait timeout reported by the
 * browser engine. Playwright and Selenium both name their timeout errors
 * `TimeoutError`.
 *
 * @param error Thrown value.
 *
 * @returns True for engine timeout errors.
 */
const isTimeoutError = (error: unknown): boolean => {
    return error instanceof Error && error.name === 'TimeoutError';
};

/**
 * Truncates long diagnostics text to keep CI logs readable.
 *
 * @param value Text to truncate.
 *
 * @returns Truncated text with a marker when truncation happened.
 */
const truncate = (value: string): string => {
    if (value.length <= DOM_SNAPSHOT_MAX_LENGTH) {
        return value;
    }

    const omitted = value.length - DOM_SNAPSHOT_MAX_LENGTH;

    return `${value.slice(0, DOM_SNAPSHOT_MAX_LENGTH)}…[truncated ${omitted} chars]`;
};

/**
 * Bounds a diagnostics probe by the smaller of the per-probe timeout and the
 * remaining dump budget, so a dump whose probes hang still returns within
 * `DIAGNOSTICS_DUMP_TIMEOUT_MS`.
 *
 * @param probe Diagnostics probe promise.
 * @param dumpDeadline Timestamp by which the whole dump must finish.
 *
 * @returns Probe result.
 *
 * @throws Error if the probe does not settle in time.
 */
const withProbeTimeout = async <T>(probe: Promise<T>, dumpDeadline: number): Promise<T> => {
    const remainingMs = dumpDeadline - Date.now();

    if (remainingMs <= 0) {
        throw new Error(`diagnostics dump timed out after ${DIAGNOSTICS_DUMP_TIMEOUT_MS}ms`);
    }

    const timeoutMs = Math.min(DIAGNOSTICS_PROBE_TIMEOUT_MS, remainingMs);

    return withTimeout(probe, timeoutMs, `diagnostics probe timed out after ${timeoutMs}ms`);
};

/**
 * Sends a direct background message from the page and waits for a bounded
 * response. Distinguishes a background that never answers (`timeout`) from one
 * that answers `false` while the app is still initializing.
 *
 * Runs in the browser context, so the handler name, message type and timeout
 * arrive as the evaluate argument and the function must not close over
 * Node-scope values.
 *
 * @param args Handler name, message type and probe timeout in milliseconds.
 *
 * @returns Probe result.
 */
const probeBackground = (args: unknown): Promise<E2EBackgroundProbe> => {
    const { handlerName, type, timeoutMs } = args as {
        handlerName: string;
        type: string;
        timeoutMs: number;
    };

    return new Promise((resolve) => {
        const globalObject = globalThis as unknown as {
            chrome?: { runtime?: BackgroundRuntime };
            browser?: { runtime?: BackgroundRuntime };
        };
        const runtime = globalObject.chrome?.runtime ?? globalObject.browser?.runtime;

        if (!runtime?.sendMessage) {
            resolve({ result: 'unavailable' });

            return;
        }

        let settled = false;

        const finish = (probe: E2EBackgroundProbe): void => {
            if (settled) {
                return;
            }

            settled = true;
            resolve(probe);
        };

        const timer = setTimeout((): void => {
            finish({ result: 'timeout' });
        }, timeoutMs);

        try {
            const maybePromise = runtime.sendMessage({ handlerName, type }, (response: unknown): void => {
                clearTimeout(timer);
                finish({
                    result: 'response',
                    response,
                    lastError: runtime.lastError?.message ?? null,
                });
            });

            if (maybePromise && typeof maybePromise.then === 'function') {
                maybePromise.then((response: unknown): void => {
                    clearTimeout(timer);
                    finish({ result: 'response', response });
                }).catch((error: unknown): void => {
                    clearTimeout(timer);
                    finish({ result: 'rejected', error: String(error) });
                });
            }
        } catch (error: unknown) {
            clearTimeout(timer);
            finish({ result: 'threw', error: String(error) });
        }
    });
};

/**
 * Sends a bounded `GetIsAppInitialized` probe from the page and returns the
 * classified result. Used by the failure diagnostics to tell a background that
 * never answers from one that answers `false` while the app is initializing.
 *
 * @param page E2E page handle.
 * @param timeoutMs Probe timeout in milliseconds.
 *
 * @returns Probe result.
 */
export const probeBackgroundInit = async (
    page: E2EPageHandle,
    timeoutMs: number = BACKGROUND_PROBE_TIMEOUT_MS,
): Promise<E2EBackgroundProbe> => {
    return page.evaluate(probeBackground, {
        handlerName: APP_MESSAGE_HANDLER_NAME,
        type: MessageType.GetIsAppInitialized,
        timeoutMs,
    });
};

/**
 * Collects a page diagnostics snapshot: current URL, truncated DOM state,
 * background probe, page errors and background errors.
 *
 * Each probe is isolated and bounded: a probe failure or timeout is recorded
 * in place and never throws, so diagnostics collection cannot mask the
 * original test failure. The whole dump is additionally bounded by
 * `DIAGNOSTICS_DUMP_TIMEOUT_MS`, which every probe shares as a deadline.
 *
 * @param page E2E page handle to collect diagnostics from.
 *
 * @returns Page diagnostics snapshot.
 */
export const collectPageDiagnostics = async (page: E2EPageHandle): Promise<E2EPageDiagnostics> => {
    const dumpDeadline = Date.now() + DIAGNOSTICS_DUMP_TIMEOUT_MS;
    const diagnostics: E2EPageDiagnostics = {
        url: '',
        domState: '',
        backgroundProbe: { result: 'unavailable' },
        pageErrors: [],
        backgroundErrors: [],
    };

    try {
        diagnostics.url = await withProbeTimeout(page.evaluate(() => window.location.href), dumpDeadline);
    } catch (error: unknown) {
        diagnostics.url = `failed to read URL: ${formatError(error)}`;
    }

    try {
        // The extension pages inline their CSS into the document, so a plain
        // `outerHTML` snapshot carries tens of KB of style payload before the
        // first body element and `truncate` would cut the body away, leaving
        // nothing to triage. Strip `<style>` and `<script>` nodes first so the
        // snapshot shows the rendered markup.
        const domState = await withProbeTimeout(page.evaluate((): string => {
            const root = document.documentElement?.cloneNode(true);

            if (!(root instanceof Element)) {
                return '';
            }

            root.querySelectorAll('style, script').forEach((element): void => {
                element.remove();
            });

            return root.outerHTML;
        }), dumpDeadline);
        diagnostics.domState = truncate(domState);
    } catch (error: unknown) {
        diagnostics.domState = `failed to read DOM: ${formatError(error)}`;
    }

    try {
        diagnostics.backgroundProbe = await withProbeTimeout(
            probeBackgroundInit(page, BACKGROUND_PROBE_TIMEOUT_MS),
            dumpDeadline,
        );
    } catch (error: unknown) {
        diagnostics.backgroundProbe = `failed to probe background: ${formatError(error)}`;
    }

    try {
        diagnostics.pageErrors = await withProbeTimeout(page.getErrors(), dumpDeadline);
    } catch (error: unknown) {
        diagnostics.pageErrors = `failed to collect page errors: ${formatError(error)}`;
    }

    try {
        diagnostics.backgroundErrors = await withProbeTimeout(page.getBackgroundErrors(), dumpDeadline);
    } catch (error: unknown) {
        diagnostics.backgroundErrors = `failed to collect background errors: ${formatError(error)}`;
    }

    return diagnostics;
};

/**
 * Logs a page diagnostics snapshot via the test logger and records that the
 * error was dumped, so an outer wrapper does not dump the same page again.
 *
 * @param page E2E page handle to collect diagnostics from.
 * @param context Human-readable label identifying the failing step.
 * @param error Error the diagnostics belong to, if any.
 *
 * @returns Nothing.
 */
const dumpPageDiagnostics = async (
    page: E2EPageHandle,
    context: string,
    error?: unknown,
): Promise<void> => {
    if (error instanceof Error) {
        dumpedErrors.add(error);
    }

    const diagnostics = await collectPageDiagnostics(page);

    logError(`[e2e] ${context} diagnostics:\n${JSON.stringify(diagnostics, null, 2)}`);
};

/**
 * Runs an E2E step and dumps page diagnostics when it fails, rethrowing the
 * original error. Failures that `waitForSelectorWithRecovery` already dumped
 * are not dumped again, so wrapping a recovery wait does not repeat the same
 * stalled-page snapshot. Use it for any step (assertions, clicks, waits) so a
 * browser test failure is triage-ready.
 *
 * @param page E2E page handle.
 * @param context Human-readable label identifying the failing step.
 * @param step Step to run.
 *
 * @returns Step result.
 *
 * @throws The original error from the step, after diagnostics are dumped.
 */
export const withDiagnosticsOnFailure = async <T>(
    page: E2EPageHandle,
    context: string,
    step: () => Promise<T>,
): Promise<T> => {
    try {
        return await step();
    } catch (error: unknown) {
        if (!(error instanceof Error && dumpedErrors.has(error))) {
            await dumpPageDiagnostics(page, context);
        }

        throw error;
    }
};

/**
 * Waits for a selector and recovers from a stalled page once: on a wait timeout
 * it dumps diagnostics, reloads the page, and retries the wait. This mitigates
 * MV3 service-worker cold-start stalls, where the extension page loads but its
 * UI never becomes interactive until the page is reloaded.
 *
 * Only engine timeouts trigger the recovery: other failures (for example a
 * closed or crashed page) cannot be fixed by a reload, so their diagnostics are
 * dumped and the original error is rethrown without retrying.
 *
 * The retry timeout dumps diagnostics again and rethrows the retry error. A
 * failed recovery reload dumps diagnostics and throws an error that keeps the
 * selector timeout context and carries the reload error as its `cause`.
 *
 * @param page E2E page handle.
 * @param selector CSS selector to wait for.
 * @param options Recovery options.
 *
 * @returns Nothing.
 *
 * @throws Error from the wait (or from the recovery reload) when the selector
 * does not appear.
 */
export const waitForSelectorWithRecovery = async (
    page: E2EPageHandle,
    selector: string,
    {
        timeoutMs,
        reloadTimeoutMs,
        retryTimeoutMs,
        context,
    }: WaitForSelectorWithRecoveryOptions,
): Promise<void> => {
    try {
        await page.waitForSelector(selector, timeoutMs);
        return;
    } catch (error: unknown) {
        if (!isTimeoutError(error)) {
            logError(`[e2e] ${context}: waiting for selector "${selector}" failed (${formatError(error)}); dumping diagnostics`);
            await dumpPageDiagnostics(page, `${context} selector "${selector}" failure`, error);
            throw error;
        }

        logError(`[e2e] ${context}: selector "${selector}" not found within ${timeoutMs}ms (${formatError(error)}); dumping diagnostics and reloading`);
        await dumpPageDiagnostics(page, `${context} selector "${selector}" timeout`, error);
    }

    logInfo(`[e2e] ${context}: reloading page and retrying selector "${selector}"`);

    try {
        await page.reload(reloadTimeoutMs);
    } catch (reloadError: unknown) {
        const error = new Error(
            `[e2e] ${context}: selector "${selector}" timed out and the recovery reload failed: ${formatError(reloadError)}`,
            { cause: reloadError },
        );
        logError(`[e2e] ${context}: page reload failed (${formatError(reloadError)}); dumping diagnostics`);
        await dumpPageDiagnostics(page, `${context} page reload failure`, error);
        throw error;
    }

    try {
        await page.waitForSelector(selector, retryTimeoutMs);
    } catch (error: unknown) {
        logError(`[e2e] ${context}: selector "${selector}" still not found after reload; dumping diagnostics`);
        await dumpPageDiagnostics(page, `${context} selector "${selector}" timeout after reload`, error);
        throw error;
    }
};
