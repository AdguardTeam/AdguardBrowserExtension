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

import { logInfo, logSection } from '../../tools/browser-test/logger';
import { unpackE2EArtifact } from '../../tools/browser-test/e2e/artifacts';
import {
    type E2ESession,
    closeE2ESession,
    launchE2ESession,
    openE2ESurface,
} from '../../tools/browser-test/e2e/session';
import { E2ESurfaceId } from '../../tools/browser-test/e2e/types';

import {
    expectNoErrors,
    getE2EEnv,
    getE2EMatrix,
    getE2ESession,
    getSurface,
} from './helpers/e2e-helpers';
import { applyOversizedRulesets } from './helpers/rule-limits-fixture';

const e2eEnv = getE2EEnv();
const e2eMatrix = getE2EMatrix();

/**
 * Timeout for waiting for a DOM element to appear, in milliseconds.
 */
const SELECTOR_WAIT_TIMEOUT_MS = 10_000;

/**
 * Short timeout for negative checks — verifying an element does NOT appear.
 */
const ABSENT_SELECTOR_TIMEOUT_MS = 2000;

/**
 * Timeout for beforeAll hooks, in milliseconds.
 * Must not exceed vitest.config.ts hookTimeout (120_000).
 */
const BEFORE_ALL_TIMEOUT_MS = 120_000;

logSection(`E2E rule limits tests (${e2eEnv})`);
logInfo(`Selected matrix: ${e2eMatrix.map((entry) => entry.id).join(', ')}`);

const mv3Entries = e2eMatrix.filter((entry) => entry.isMv3);

if (mv3Entries.length === 0) {
    logInfo('[rule-limits] No MV3 entries in matrix — skipping');
}

mv3Entries.forEach((entry) => {
    let extensionPath: string;

    beforeAll(async () => {
        logInfo(`[rule-limits] Unpacking ${e2eEnv} artifact for ${entry.id}`);
        extensionPath = await unpackE2EArtifact(entry, e2eEnv);
    }, BEFORE_ALL_TIMEOUT_MS);

    describe(`[rule-limits] ${entry.id} — before oversized rulesets`, () => {
        let e2eSession: E2ESession | undefined;

        beforeAll(async () => {
            logInfo('[rule-limits] Launching Chromium session (clean extension)');
            e2eSession = await launchE2ESession(entry, extensionPath);
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
                    // Wait for the popup to finish loading — the protection
                    // switch is always visible once the UI is ready.
                    await page.waitForSelector('button[role="switch"]', SELECTOR_WAIT_TIMEOUT_MS);
                    await expect(
                        page.waitForSelector(
                            'button[title="Rule limits"]',
                            ABSENT_SELECTOR_TIMEOUT_MS,
                        ),
                    ).rejects.toThrow();
                } finally {
                    await page.close();
                }
            }

            // Options
            {
                const surface = getSurface(E2ESurfaceId.Options);
                const page = await openE2ESurface(session, entry, surface);

                try {
                    await page.waitForSelector('#root .page', SELECTOR_WAIT_TIMEOUT_MS);
                    await expect(
                        page.waitForSelector(
                            'button[title="Rule limits"]',
                            ABSENT_SELECTOR_TIMEOUT_MS,
                        ),
                    ).rejects.toThrow();
                } finally {
                    await page.close();
                }
            }
        });
    });

    /**
     * Test strategy:
     * 1. Launch with normal rulesets → extension records expected filters
     *    in IndexedDB / chrome.storage.local.
     * 2. Close browser — persistent Chromium profile stays on disk.
     * 3. Replace ruleset_2 + ruleset_10 with oversized versions, update checksums.
     * 4. Re-launch with same profile. Extension remembers expected filters,
     *    but Chrome disables some (budget exceeded).
     *    Mismatch → areFilterLimitsExceeded = true → notification.
     */
    describe(`[rule-limits] ${entry.id} — with oversized rulesets`, () => {
        let e2eSession: E2ESession | undefined;

        beforeAll(async () => {
            logInfo('[rule-limits] Warm-up launch (normal rulesets)');
            const cleanSession = await launchE2ESession(entry, extensionPath);
            await closeE2ESession(cleanSession);

            logInfo('[rule-limits] Injecting oversized rulesets');
            await applyOversizedRulesets(extensionPath);

            logInfo('[rule-limits] Relaunching (oversized rulesets)');
            e2eSession = await launchE2ESession(entry, extensionPath, { cleanProfile: false });
        }, BEFORE_ALL_TIMEOUT_MS);

        afterAll(async () => {
            if (e2eSession) {
                await closeE2ESession(e2eSession);
            }
        });

        it('shows rule limits exceeded notification in popup', async () => {
            const session = getE2ESession(e2eSession);
            const surface = getSurface(E2ESurfaceId.Popup);
            const page = await openE2ESurface(session, entry, surface);

            try {
                await page.waitForSelector('button[title="Rule limits"]', SELECTOR_WAIT_TIMEOUT_MS);

                expect(
                    await page.querySelectorCount('button[title="Rule limits"]'),
                ).toBeGreaterThan(0);

                const bgErrors = await page.getBackgroundErrors();
                expectNoErrors(bgErrors, `${entry.id}/popup background errors`);
            } finally {
                await page.close();
            }
        });

        it('shows rule limits exceeded notification on options page', async () => {
            const session = getE2ESession(e2eSession);
            const surface = getSurface(E2ESurfaceId.Options);
            const page = await openE2ESurface(session, entry, surface);

            try {
                await page.waitForSelector('#root .page', SELECTOR_WAIT_TIMEOUT_MS);
                await page.waitForSelector('button[title="Rule limits"]', SELECTOR_WAIT_TIMEOUT_MS);

                await page.clickSelector('button[title="Rule limits"]');
                await page.waitForSelector('.rules-limits', SELECTOR_WAIT_TIMEOUT_MS);

                const bgErrors = await page.getBackgroundErrors();
                expectNoErrors(bgErrors, `${entry.id}/options background errors`);
            } finally {
                await page.close();
            }
        });
    });
});
