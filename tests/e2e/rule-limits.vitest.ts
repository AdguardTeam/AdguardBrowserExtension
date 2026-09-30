/**
 * Copyright (c) 2015-2026 Adguard Software Ltd.
 *
 * @file E2E test for rule limits exceeded notification (MV3 only).
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
    afterAll,
    beforeAll,
    describe,
    expect,
    it,
} from 'vitest';

import { type Configuration } from '@adguard/tswebextension/mv3';

import { logInfo, logSection } from '../../tools/browser-test/logger';
import { unpackE2EArtifact } from '../../tools/browser-test/e2e/artifacts';
import { type E2EPageHandle } from '../../tools/browser-test/e2e/page-handle';
import {
    type E2ESession,
    closeE2ESession,
    launchE2ESession,
    openE2ESurface,
} from '../../tools/browser-test/e2e/session';
import { E2EBrowserEngine, E2ESurfaceId } from '../../tools/browser-test/e2e/types';
import { DEFAULT_EXTENSION_CONFIG } from '../../tools/browser-test/test-constants';
import { ADGUARD_SETTINGS_KEY } from '../../Extension/src/common/constants';
import { SettingOption } from '../../Extension/src/background/schema/settings/enum';

import {
    expectNoErrors,
    getE2EEnv,
    getE2EMatrix,
    getE2ESession,
    getSurface,
} from './helpers/e2e-helpers';
import {
    DIAGNOSTICS_DUMP_TIMEOUT_MS,
    SELECTOR_RECOVERY_BUDGET_MS,
    SELECTOR_RELOAD_TIMEOUT_MS,
    SELECTOR_RETRY_TIMEOUT_MS,
    SELECTOR_WAIT_TIMEOUT_MS,
    waitForSelectorWithRecovery,
    withDiagnosticsOnFailure,
} from './helpers/page-recovery-helpers';
import { applyOversizedRulesets } from './helpers/rule-limits-fixture';

const e2eEnv = getE2EEnv();
const e2eMatrix = getE2EMatrix();

/**
 * Per-test timeout for tests that chain two recovery waits (up to
 * SELECTOR_RECOVERY_BUDGET_MS each), in milliseconds. This exceeds the global
 * e2e testTimeout (120_000); without the override Vitest aborts the test before
 * the second wait's diagnostics are dumped — the very triage data these tests
 * exist to collect. The worst path produces three dumps (the first wait timing
 * out, the second wait timing out and its retry timing out), each bounded by
 * DIAGNOSTICS_DUMP_TIMEOUT_MS. Budgets are sized per test instead of shared so
 * the test timeouts fit the 30-minute e2e job budget even with `retry: 1`; that
 * figure covers the tests only, excluding the `beforeAll` hooks and the other
 * e2e files that share the job (`fileParallelism: false`).
 */
const TWO_WAITS_TEST_TIMEOUT_MS = 2 * SELECTOR_RECOVERY_BUDGET_MS
    + 3 * DIAGNOSTICS_DUMP_TIMEOUT_MS;

/**
 * Timeout for the click that opens the rules-limits panel, in milliseconds.
 * Matches the default action timeout Playwright uses in `clickSelector`.
 */
const CLICK_TIMEOUT_MS = 30_000;

/**
 * Per-test timeout for the options test with oversized rulesets, in
 * milliseconds: two recovery waits, the click and the post-click wait for the
 * opened rules-limits panel.
 */
const OPTIONS_TIMEOUT_MS = TWO_WAITS_TEST_TIMEOUT_MS + CLICK_TIMEOUT_MS + SELECTOR_WAIT_TIMEOUT_MS;

/**
 * Locale-independent selector for the rule limits notification button.
 * Matches both popup and options page notification structures.
 */
const RULE_LIMITS_NOTIFICATION_BUTTON_SELECTOR = '.notifications .notification .notification__content button';

/**
 * Selector for the rule limits notification container (used for negative checks).
 */
const RULE_LIMITS_NOTIFICATION_SELECTOR = '.notifications .notification';

/**
 * Short timeout for negative checks — verifying an element does NOT appear.
 */
const ABSENT_SELECTOR_TIMEOUT_MS = 2000;

/**
 * Timeout for beforeAll hooks, in milliseconds.
 * Must not exceed vitest.config.ts hookTimeout (120_000).
 */
const BEFORE_ALL_TIMEOUT_MS = 120_000;

/**
 * Enable the English filter (2) and Search & Self-Promo filter (10).
 * These rulesets will be replaced with oversized versions.
 */
const RULE_LIMITS_CONFIG: Configuration = {
    ...DEFAULT_EXTENSION_CONFIG,
    staticFiltersIds: [2, 10],
};

/**
 * Waits for a selector on an extension page with the standard recovery budget:
 * on an engine timeout the page is reloaded once and the wait is retried, and
 * every failed attempt dumps page diagnostics.
 *
 * @param page E2E page handle.
 * @param selector CSS selector to wait for.
 * @param context Human-readable label for logs, for example `chrome-mv3/popup`.
 *
 * @returns Nothing.
 */
const waitForExtensionSelector = async (
    page: E2EPageHandle,
    selector: string,
    context: string,
): Promise<void> => {
    await waitForSelectorWithRecovery(page, selector, {
        timeoutMs: SELECTOR_WAIT_TIMEOUT_MS,
        reloadTimeoutMs: SELECTOR_RELOAD_TIMEOUT_MS,
        retryTimeoutMs: SELECTOR_RETRY_TIMEOUT_MS,
        context,
    });
};

/**
 * Browser-context callbacks run via Playwright `evaluate`. Their bodies close
 * over no Node-scope variables — keys/values are passed as the second
 * `evaluate` argument because the callback executes in the browser page.
 */

/**
 * Browser-context: writes the injected filter-state and rules-limits into
 * chrome.storage.local.
 */
const injectFiltersState = async (args: {
    settingsKey: string;
    filtersStateKey: string;
    filterState: string;
}) => {
    const result = await chrome.storage.local.get(args.settingsKey);
    const settings = result[args.settingsKey] ?? {};
    settings[args.filtersStateKey] = args.filterState;
    await chrome.storage.local.set({
        [args.settingsKey]: settings,
        'rules-limits': JSON.stringify([2, 10]),
    });
};

/**
 * Browser-context: reads filters-state back from chrome.storage.local to
 * confirm the injected value persisted.
 */
const readPersistedFiltersState = async (args: {
    settingsKey: string;
    filtersStateKey: string;
}) => {
    const result = await chrome.storage.local.get(args.settingsKey);
    return result[args.settingsKey]?.[args.filtersStateKey];
};

logSection(`E2E rule limits tests (${e2eEnv})`);
logInfo(`Selected matrix: ${e2eMatrix.map((entry) => entry.id).join(', ')}`);

const mv3Entries = e2eMatrix.filter((entry) => entry.isMv3);

if (mv3Entries.length === 0) {
    logInfo('[rule-limits] No MV3 entries in matrix — skipping');
    // Register a skipped suite so this file is not flagged as having no
    // tests when the selected matrix contains no MV3 entries (e.g. when
    // running only the Firefox MV2 matrix). Vitest fails test files that
    // collect zero test suites; an explicit skip keeps the run green.
    describe.skip('[rule-limits] no MV3 entries in matrix', () => {});
}

mv3Entries.forEach((entry) => {
    let extensionPath: string;

    beforeAll(async () => {
        logInfo(`[rule-limits] Unpacking ${e2eEnv} artifact for ${entry.id}`);
        extensionPath = await unpackE2EArtifact(entry, e2eEnv);
    }, BEFORE_ALL_TIMEOUT_MS);

    describe(`[rule-limits] ${entry.id} — before oversized rulesets`, { timeout: TWO_WAITS_TEST_TIMEOUT_MS }, () => {
        let e2eSession: E2ESession | undefined;

        beforeAll(async () => {
            logInfo('[rule-limits] Launching Chromium session (clean extension)');
            e2eSession = await launchE2ESession(entry, extensionPath, {
                config: RULE_LIMITS_CONFIG,
            });
        }, BEFORE_ALL_TIMEOUT_MS);

        afterAll(async () => {
            if (e2eSession) {
                await closeE2ESession(e2eSession);
            }
        });

        it('does not show rule limits warning with normal rulesets', async () => {
            const session = getE2ESession(e2eSession);

            // Popup
            {
                const surface = getSurface(E2ESurfaceId.Popup);
                const page = await openE2ESurface(session, entry, surface);

                try {
                    await withDiagnosticsOnFailure(page, `${entry.id}/popup`, async () => {
                        await waitForExtensionSelector(page, 'button[role="switch"]', `${entry.id}/popup switch`);
                        await expect(
                            page.waitForSelector(
                                RULE_LIMITS_NOTIFICATION_SELECTOR,
                                ABSENT_SELECTOR_TIMEOUT_MS,
                            ),
                        ).rejects.toThrow();
                    });
                } finally {
                    await page.close();
                }
            }

            // Options
            {
                const surface = getSurface(E2ESurfaceId.Options);
                const page = await openE2ESurface(session, entry, surface);

                try {
                    await withDiagnosticsOnFailure(page, `${entry.id}/options`, async () => {
                        await waitForExtensionSelector(page, '#root .page', `${entry.id}/options page`);
                        await expect(
                            page.waitForSelector(
                                RULE_LIMITS_NOTIFICATION_SELECTOR,
                                ABSENT_SELECTOR_TIMEOUT_MS,
                            ),
                        ).rejects.toThrow();
                    });
                } finally {
                    await page.close();
                }
            }
        });
    });

    /**
     * Two-session approach: dev builds ship no text-rule files, so
     * initDefaultFilters() can't enable filters on first install. We use a
     * setup session to inject filter-state + rules-limits into storage, then
     * relaunch with cleanProfile: false so the new SW sees the injected state
     * and triggers areFilterLimitsExceeded() when oversized rulesets exceed
     * Chrome's static-rule budget.
     */
    describe(`[rule-limits] ${entry.id} — with oversized rulesets`, () => {
        let e2eSession: E2ESession | undefined;

        beforeAll(async () => {
            logInfo('[rule-limits] Injecting oversized rulesets (before launch)');
            await applyOversizedRulesets(extensionPath);

            logInfo('[rule-limits] Launching setup session (clean profile)');
            const setupSession = await launchE2ESession(entry, extensionPath, {
                config: null,
            });

            // This test is MV3-only, so the session is always Chromium. Narrow
            // the E2ESession discriminated union by engine to obtain a typed
            // background target instead of downcasting to `any`.
            if (setupSession.engine !== E2EBrowserEngine.PlaywrightChromium) {
                throw new Error('[rule-limits] setup session requires Chromium');
            }
            const setupTarget = setupSession.session.backgroundTarget;

            // Inject filter-state {2,10} and rules-limits [2,10], retrying
            // until the value persists. The SW's post-init storage saves can
            // race with ours and overwrite filter-state; this read-back replaces
            // a fragile fixed-delay wait.
            logInfo('[rule-limits] Writing filter state to storage');
            const injectedFilterState = JSON.stringify({
                2: { enabled: true, installed: true, loaded: true },
                10: { enabled: true, installed: true, loaded: true },
            });
            const SETTLE_MAX_ATTEMPTS = 60;
            const SETTLE_INTERVAL_MS = 250;
            for (let attempt = 0; attempt < SETTLE_MAX_ATTEMPTS; attempt += 1) {
                await setupTarget.evaluate(injectFiltersState, {
                    settingsKey: ADGUARD_SETTINGS_KEY,
                    filtersStateKey: SettingOption.FiltersState,
                    filterState: injectedFilterState,
                });

                const persisted = await setupTarget.evaluate(readPersistedFiltersState, {
                    settingsKey: ADGUARD_SETTINGS_KEY,
                    filtersStateKey: SettingOption.FiltersState,
                });

                if (persisted === injectedFilterState) {
                    break;
                }
                if (attempt === SETTLE_MAX_ATTEMPTS - 1) {
                    throw new Error('[rule-limits] Timed out waiting for injected filter state to persist');
                }
                await new Promise((resolve) => {
                    setTimeout(resolve, SETTLE_INTERVAL_MS);
                });
            }

            logInfo('[rule-limits] Closing setup session');
            await closeE2ESession(setupSession);

            logInfo('[rule-limits] Launching test session (reusing profile)');
            e2eSession = await launchE2ESession(entry, extensionPath, {
                config: null,
                cleanProfile: false,
            });
        }, BEFORE_ALL_TIMEOUT_MS);

        afterAll(async () => {
            if (e2eSession) {
                await closeE2ESession(e2eSession);
            }
        });

        it('shows rule limits exceeded notification in popup', { timeout: TWO_WAITS_TEST_TIMEOUT_MS }, async () => {
            const session = getE2ESession(e2eSession);
            const surface = getSurface(E2ESurfaceId.Popup);
            const page = await openE2ESurface(session, entry, surface);

            try {
                await withDiagnosticsOnFailure(page, `${entry.id}/popup`, async () => {
                    await waitForExtensionSelector(page, 'button[role="switch"]', `${entry.id}/popup switch`);
                    await waitForExtensionSelector(
                        page,
                        RULE_LIMITS_NOTIFICATION_BUTTON_SELECTOR,
                        `${entry.id}/popup rule limits notification`,
                    );

                    expect(
                        await page.querySelectorCount(RULE_LIMITS_NOTIFICATION_BUTTON_SELECTOR),
                    ).toBeGreaterThan(0);

                    const bgErrors = await page.getBackgroundErrors();
                    expectNoErrors(bgErrors, `${entry.id}/popup background errors`);
                });
            } finally {
                await page.close();
            }
        });

        it('shows rule limits exceeded notification on options page', { timeout: OPTIONS_TIMEOUT_MS }, async () => {
            const session = getE2ESession(e2eSession);
            const surface = getSurface(E2ESurfaceId.Options);
            const page = await openE2ESurface(session, entry, surface);

            try {
                await withDiagnosticsOnFailure(page, `${entry.id}/options`, async () => {
                    await waitForExtensionSelector(page, '#root .page', `${entry.id}/options page`);
                    await waitForExtensionSelector(
                        page,
                        RULE_LIMITS_NOTIFICATION_BUTTON_SELECTOR,
                        `${entry.id}/options rule limits notification`,
                    );

                    await page.clickSelector(RULE_LIMITS_NOTIFICATION_BUTTON_SELECTOR);
                    // The page is already interactive after the wait above, so
                    // the post-click wait does not need the cold-start recovery
                    // budget; a reload could not replay the click anyway.
                    await page.waitForSelector('.rules-limits', SELECTOR_WAIT_TIMEOUT_MS);

                    const bgErrors = await page.getBackgroundErrors();
                    expectNoErrors(bgErrors, `${entry.id}/options background errors`);
                });
            } finally {
                await page.close();
            }
        });
    });
});
