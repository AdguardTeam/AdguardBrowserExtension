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

import { BuildTargetEnv } from '../../constants';
import { logInfo, logSection } from '../../tools/browser-test/logger';
import { unpackE2EArtifact } from '../../tools/browser-test/e2e/artifacts';
import { E2E_MATRIX, E2E_SURFACES } from '../../tools/browser-test/e2e/matrix';
import {
    type E2ESession,
    closeE2ESession,
    launchE2ESession,
    openE2ESurface,
} from '../../tools/browser-test/e2e/session';
import {
    type E2EMatrixEntry,
    E2ESpecialSurfaceId,
    E2ESurfaceId,
    type E2ESurface,
} from '../../tools/browser-test/e2e/types';
import { E2E_VITEST_ENV_KEY, E2E_VITEST_MATRIX_IDS_KEY } from '../../tools/browser-test/e2e/vitest-runner';

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
                    expect(await page.getErrors()).toHaveLength(0);
                    expect(await page.getBackgroundErrors()).toHaveLength(0);
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
                    expect(await page.getErrors()).toHaveLength(0);
                    expect(await page.getBackgroundErrors()).toHaveLength(0);
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
                    expect(await page.getErrors()).toHaveLength(0);
                    expect(await page.getBackgroundErrors()).toHaveLength(0);
                } finally {
                    await page.close();
                }
            });
        });

        describe(E2ESpecialSurfaceId.Background, () => {
            it('has no errors', () => {
                const session = getE2ESession(e2eSession);
                const errors = session.session.backgroundErrors.getErrors();

                expect(errors).toHaveLength(0);
            });
        });
    });
});

/**
 * Returns E2E build target environment from process env.
 *
 * @returns E2E build target environment.
 *
 * @throws Error if E2E build environment is not set.
 */
function getE2EEnv(): BuildTargetEnv {
    const env = process.env[E2E_VITEST_ENV_KEY];

    if (!env || !Object.values(BuildTargetEnv).includes(env as BuildTargetEnv)) {
        throw new Error('E2E build env is not set. Run pnpm test:e2e <env>.');
    }

    return env as BuildTargetEnv;
}

/**
 * Returns selected E2E matrix entries from process env.
 *
 * @returns E2E matrix entries.
 */
function getE2EMatrix(): E2EMatrixEntry[] {
    const rawMatrixIds = process.env[E2E_VITEST_MATRIX_IDS_KEY];

    if (!rawMatrixIds) {
        return E2E_MATRIX;
    }

    const matrixIds = new Set(rawMatrixIds.split(',').filter(Boolean));

    return E2E_MATRIX.filter((entry) => matrixIds.has(entry.id));
}

/**
 * Returns a launched E2E session or throws.
 *
 * @param e2eSession Optional E2E session.
 *
 * @returns E2E session.
 *
 * @throws Error if E2E session was not launched.
 */
function getE2ESession(e2eSession?: E2ESession): E2ESession {
    if (!e2eSession) {
        throw new Error('E2E session was not launched.');
    }

    return e2eSession;
}

/**
 * Returns surface config by id.
 *
 * @param id Surface id.
 *
 * @returns E2E surface.
 *
 * @throws Error if surface not found.
 */
function getSurface(id: E2ESurfaceId): E2ESurface {
    const surface = E2E_SURFACES.find((s) => s.id === id);

    if (!surface) {
        throw new Error(`E2E surface not found: ${id}`);
    }

    return surface;
}
