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

import { logInfo } from '../logger';

import type { E2EPageHandle } from './page-handle';
import {
    closeChromiumE2ESession,
    launchChromiumE2ESession,
    openChromiumE2ESurface,
} from './playwright-chromium';
import {
    closeFirefoxE2ESession,
    launchFirefoxE2ESession,
    openFirefoxE2ESurface,
} from './selenium-firefox';
import {
    E2EBrowserEngine,
    type E2EMatrixEntry,
    type E2ESurface,
} from './types';

type ChromiumSession = Awaited<ReturnType<typeof launchChromiumE2ESession>>;

type FirefoxSession = Awaited<ReturnType<typeof launchFirefoxE2ESession>>;

/**
 * Engine-agnostic E2E browser session.
 */
export type E2ESession = {
    engine: E2EBrowserEngine.PlaywrightChromium;
    session: ChromiumSession;
} | {
    engine: E2EBrowserEngine.SeleniumFirefox;
    session: FirefoxSession;
};

/**
 * Returns the E2E browser mode label.
 *
 * @returns Headless mode label.
 */
const getE2EHeadlessMode = (): string => {
    return process.env.E2E_HEADLESS === 'false' ? 'headed' : 'headless';
};

/**
 * Launches an E2E session for a matrix entry.
 *
 * @param entry E2E matrix entry.
 * @param extensionPath Unpacked extension path.
 *
 * @returns E2E session.
 */
export const launchE2ESession = async (
    entry: E2EMatrixEntry,
    extensionPath: string,
): Promise<E2ESession> => {
    if (entry.engine === E2EBrowserEngine.PlaywrightChromium) {
        logInfo(`[${entry.id}] launching Chromium (${getE2EHeadlessMode()})`);

        return {
            engine: E2EBrowserEngine.PlaywrightChromium,
            session: await launchChromiumE2ESession(entry, extensionPath),
        };
    }

    logInfo(`[${entry.id}] launching Firefox (${getE2EHeadlessMode()})`);

    return {
        engine: E2EBrowserEngine.SeleniumFirefox,
        session: await launchFirefoxE2ESession(entry, extensionPath),
    };
};

/**
 * Closes an E2E session.
 *
 * @param e2eSession E2E session.
 */
export const closeE2ESession = async (e2eSession: E2ESession): Promise<void> => {
    if (e2eSession.engine === E2EBrowserEngine.PlaywrightChromium) {
        await closeChromiumE2ESession(e2eSession.session);
        return;
    }

    await closeFirefoxE2ESession(e2eSession.session);
};

/**
 * Opens an E2E surface page.
 *
 * @param e2eSession E2E session.
 * @param entry E2E matrix entry.
 * @param surface E2E surface.
 *
 * @returns Page handle for assertions.
 */
export const openE2ESurface = async (
    e2eSession: E2ESession,
    entry: E2EMatrixEntry,
    surface: E2ESurface,
): Promise<E2EPageHandle> => {
    logInfo(`[${entry.id}] opening ${surface.id}`);

    if (e2eSession.engine === E2EBrowserEngine.PlaywrightChromium) {
        return openChromiumE2ESurface(e2eSession.session, entry, surface);
    }

    return openFirefoxE2ESurface(e2eSession.session, entry, surface);
};
