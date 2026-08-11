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
    afterAll,
    beforeAll,
    describe,
    expect,
    it,
} from 'vitest';

import { logInfo, logSection } from '../../tools/browser-test/logger';
import { unpackE2EArtifact } from '../../tools/browser-test/e2e/artifacts';
import { BENIGN_ERROR_PATTERNS, filterBenignErrors } from '../../tools/browser-test/e2e/benign-errors';
import {
    type E2ESession,
    closeE2ESession,
    launchE2ESession,
    openE2ESurface,
} from '../../tools/browser-test/e2e/session';
import { E2ESpecialSurfaceId, E2ESurfaceId } from '../../tools/browser-test/e2e/types';

import {
    expectNoErrors,
    getE2EEnv,
    getE2EMatrix,
    getE2ESession,
    getSurface,
} from './helpers/e2e-helpers';

const e2eEnv = getE2EEnv();
const e2eMatrix = getE2EMatrix();

logSection(`E2E tests (${e2eEnv})`);
logInfo(`Selected matrix: ${e2eMatrix.map((entry) => entry.id).join(', ')}`);

e2eMatrix.forEach((entry) => {
    describe(entry.id, () => {
        let e2eSession: E2ESession | undefined;

        beforeAll(async () => {
            logInfo(`[${entry.id}] unpacking ${e2eEnv} artifact`);

            const extensionPath = await unpackE2EArtifact(entry, e2eEnv);

            e2eSession = await launchE2ESession(entry, extensionPath);
        });

        afterAll(async () => {
            if (!e2eSession) {
                return;
            }

            await closeE2ESession(e2eSession);
        });

        describe(E2ESurfaceId.Popup, () => {
            it('renders page', async () => {
                const surface = getSurface(E2ESurfaceId.Popup);
                const page = await openE2ESurface(getE2ESession(e2eSession), entry, surface);

                try {
                    expect(await page.querySelectorCount('#root > *')).toBeGreaterThan(0);

                    const pageErrors = await page.getErrors();
                    expectNoErrors(pageErrors, `${entry.id}/${surface.id} page errors`);

                    const bgErrors = await page.getBackgroundErrors();
                    expectNoErrors(bgErrors, `${entry.id}/${surface.id} background errors`);
                } finally {
                    await page.close();
                }
            });
        });

        describe(E2ESurfaceId.Options, () => {
            it('renders page', async () => {
                const surface = getSurface(E2ESurfaceId.Options);
                const page = await openE2ESurface(getE2ESession(e2eSession), entry, surface);

                try {
                    await page.waitForSelector('#root .page');
                    expect(await page.querySelectorCount('#root .page')).toBeGreaterThan(0);

                    const pageErrors = await page.getErrors();
                    expectNoErrors(pageErrors, `${entry.id}/${surface.id} page errors`);

                    const bgErrors = await page.getBackgroundErrors();
                    expectNoErrors(bgErrors, `${entry.id}/${surface.id} background errors`);
                } finally {
                    await page.close();
                }
            });
        });

        describe(E2ESurfaceId.FilteringLog, () => {
            it('renders page', async () => {
                const surface = getSurface(E2ESurfaceId.FilteringLog);
                const page = await openE2ESurface(getE2ESession(e2eSession), entry, surface);

                try {
                    expect(await page.querySelectorCount('#root > *')).toBeGreaterThan(0);

                    const pageErrors = await page.getErrors();
                    expectNoErrors(pageErrors, `${entry.id}/${surface.id} page errors`);

                    const bgErrors = await page.getBackgroundErrors();
                    expectNoErrors(bgErrors, `${entry.id}/${surface.id} background errors`);
                } finally {
                    await page.close();
                }
            });
        });

        describe(E2ESpecialSurfaceId.Background, () => {
            it('has no errors', () => {
                const session = getE2ESession(e2eSession);
                const allErrors = session.session.backgroundErrors.getErrors();
                const errors = filterBenignErrors(allErrors, BENIGN_ERROR_PATTERNS);

                expectNoErrors(errors, `${entry.id} background errors`);
            });
        });
    });
});
