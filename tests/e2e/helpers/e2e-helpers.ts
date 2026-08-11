/**
 * Copyright (c) 2015-2026 Adguard Software Ltd.
 *
 * @file Shared E2E test helpers: environment, matrix, surface resolution, error assertions.
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

import { expect } from 'vitest';

import { BuildTargetEnv } from '../../../constants';
import { logError } from '../../../tools/browser-test/logger';
import { E2E_MATRIX, E2E_SURFACES } from '../../../tools/browser-test/e2e/matrix';
import {
    type E2EMatrixEntry,
    type E2ESurface,
    type E2ESurfaceId,
} from '../../../tools/browser-test/e2e/types';
import type { E2ESession } from '../../../tools/browser-test/e2e/session';
import { E2E_VITEST_ENV_KEY, E2E_VITEST_MATRIX_IDS_KEY } from '../../../tools/browser-test/e2e/vitest-runner';

/**
 * Asserts that errors array is empty. When errors are present, logs them via
 * the test logger before failing — this ensures CI output contains the full
 * error details for diagnostics even though Vitest truncates assertion diffs.
 *
 * @param errors Collected errors to check.
 * @param context Human-readable label identifying the source (e.g. "chrome/popup page errors").
 */
export const expectNoErrors = (errors: unknown[], context: string): void => {
    if (errors.length > 0) {
        logError(`[e2e] ${context}:\n${JSON.stringify(errors, null, 2)}`);
    }
    expect(errors).toHaveLength(0);
};

/**
 * Returns E2E build target environment from process env.
 *
 * @returns E2E build target environment.
 *
 * @throws Error if E2E build environment is not set.
 */
export const getE2EEnv = (): BuildTargetEnv => {
    const env = process.env[E2E_VITEST_ENV_KEY];

    if (!env || !Object.values(BuildTargetEnv).includes(env as BuildTargetEnv)) {
        throw new Error('E2E build env is not set. Run pnpm test:e2e <env>.');
    }

    return env as BuildTargetEnv;
};

/**
 * Returns selected E2E matrix entries from process env.
 *
 * @returns E2E matrix entries.
 */
export const getE2EMatrix = (): E2EMatrixEntry[] => {
    const rawMatrixIds = process.env[E2E_VITEST_MATRIX_IDS_KEY];

    if (!rawMatrixIds) {
        return E2E_MATRIX;
    }

    const matrixIds = new Set(rawMatrixIds.split(',').filter(Boolean));

    return E2E_MATRIX.filter((entry) => matrixIds.has(entry.id));
};

/**
 * Returns a launched E2E session or throws.
 *
 * @param e2eSession Optional E2E session.
 *
 * @returns E2E session.
 *
 * @throws Error if E2E session was not launched.
 */
export const getE2ESession = (e2eSession?: E2ESession): E2ESession => {
    if (!e2eSession) {
        throw new Error('E2E session was not launched.');
    }

    return e2eSession;
};

/**
 * Returns surface config by id.
 *
 * @param id Surface id.
 *
 * @returns E2E surface.
 *
 * @throws Error if surface not found.
 */
export const getSurface = (id: E2ESurfaceId): E2ESurface => {
    const surface = E2E_SURFACES.find((s) => s.id === id);

    if (!surface) {
        throw new Error(`E2E surface not found: ${id}`);
    }

    return surface;
};
