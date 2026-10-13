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
import path from 'node:path';

import {
    describe,
    expect,
    it,
} from 'vitest';

import { FIREFOX_PINNED_VERSION, GECKODRIVER_PINNED_VERSION } from '../../../tools/browser-test/e2e/selenium-firefox';

const DOCKERFILE_PATH = path.resolve(__dirname, '../../../Dockerfile');

/**
 * The Dockerfile preinstalls the pinned Firefox build and geckodriver for E2E
 * runs, but CI never passes `--build-arg FIREFOX_VERSION`/`GECKODRIVER_VERSION`,
 * so the ARG defaults are what CI actually uses. `FIREFOX_PINNED_VERSION` also
 * governs local runs through selenium-manager, while `GECKODRIVER_PINNED_VERSION`
 * is only the value this guard keeps in sync — selenium-manager picks the
 * driver itself unless `E2E_GECKODRIVER_BIN` is set. A drift silently makes CI
 * test a different browser or driver than the pins describe, the exact failure
 * mode the pins exist to prevent.
 */
describe('Firefox pin', () => {
    it('keeps the Dockerfile FIREFOX_VERSION default in sync with FIREFOX_PINNED_VERSION', () => {
        const dockerfile = fs.readFileSync(DOCKERFILE_PATH, 'utf8');
        const argDefault = dockerfile.match(/^ARG FIREFOX_VERSION=(.+)$/m)?.[1]?.trim();

        expect(argDefault).toBe(FIREFOX_PINNED_VERSION);
    });

    it('keeps the Dockerfile GECKODRIVER_VERSION default in sync with GECKODRIVER_PINNED_VERSION', () => {
        const dockerfile = fs.readFileSync(DOCKERFILE_PATH, 'utf8');
        const argDefault = dockerfile.match(/^ARG GECKODRIVER_VERSION=(.+)$/m)?.[1]?.trim();

        expect(argDefault).toBe(GECKODRIVER_PINNED_VERSION);
    });

    it('keeps the geckodriver download verified and wired into the E2E harness', () => {
        const dockerfile = fs.readFileSync(DOCKERFILE_PATH, 'utf8');

        expect(dockerfile).toMatch(/^ARG GECKODRIVER_SHA256=[0-9a-f]{64}$/m);
        expect(dockerfile).toContain('ENV E2E_GECKODRIVER_BIN=/opt/geckodriver/geckodriver');
    });
});
