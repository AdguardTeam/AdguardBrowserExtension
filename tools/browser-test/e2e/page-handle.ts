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

import type { E2EError } from './types';

/**
 * Engine-agnostic handle to a navigated E2E surface page.
 * Exposes query methods for test assertions.
 */
export type E2EPageHandle = {
    /**
     * Counts elements matching a CSS selector on the page.
     *
     * @param selector CSS selector.
     *
     * @returns Number of matching elements.
     */
    querySelectorCount(selector: string): Promise<number>;

    /**
     * Waits until at least one element matching the selector appears on the page.
     *
     * @param selector CSS selector.
     * @param timeoutMs Maximum time to wait in milliseconds.
     */
    waitForSelector(selector: string, timeoutMs?: number): Promise<void>;

    /**
     * Returns collected page-level errors (console errors, uncaught exceptions).
     *
     * @returns Collected E2E errors.
     */
    getErrors(): Promise<E2EError[]>;

    /**
     * Returns collected background-level errors that occurred during surface navigation.
     *
     * @returns Collected background E2E errors.
     */
    getBackgroundErrors(): Promise<E2EError[]>;

    /**
     * Closes the page (Chromium) or is a no-op (Firefox, since driver reuses window).
     *
     * @returns Nothing.
     */
    close(): Promise<void>;
};
