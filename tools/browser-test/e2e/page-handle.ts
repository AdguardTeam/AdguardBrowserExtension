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
     * Clicks the first element matching a CSS selector.
     *
     * @param selector CSS selector.
     */
    clickSelector(selector: string): Promise<void>;

    /**
     * Focuses the first element matching a CSS selector and types the given
     * text using real key events. Unlike `evaluate`-based DOM manipulation,
     * key events are handled by rich-text widgets (e.g. CodeMirror) in all
     * browsers.
     *
     * @param selector CSS selector of the element to type into.
     * @param text Text to type.
     */
    typeText(selector: string, text: string): Promise<void>;

    /**
     * Evaluates a function in the browser page context and returns its result.
     *
     * The function body closes over no Node-scope variables — arguments are
     * passed as the second parameter because the callback executes in the
     * browser page.
     *
     * @param fn Function to evaluate in the browser context.
     * @param arg Argument to pass to the function.
     *
     * @returns Result of the function evaluation.
     */
    evaluate<T>(fn: (arg: unknown) => Promise<T> | T, arg?: unknown): Promise<T>;

    /**
     * Returns the text content of all elements matching a CSS selector.
     *
     * @param selector CSS selector.
     *
     * @returns Array of text contents (empty strings for elements with no text).
     */
    getTextContents(selector: string): Promise<string[]>;

    /**
     * Closes the page (Chromium) or is a no-op (Firefox, since driver reuses window).
     *
     * @returns Nothing.
     */
    close(): Promise<void>;
};
