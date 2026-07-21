/**
 * Copyright (c) 2015-2026 Adguard Software Ltd.
 *
 * @file Shared E2E helpers for user rules list/editor tests: browser-context
 * messaging functions, page navigation and polling utilities.
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

import { type E2ESession, openE2ESurface } from '../../../tools/browser-test/e2e/session';
import { type E2EPageHandle } from '../../../tools/browser-test/e2e/page-handle';
import { type E2EMatrixEntry, E2ESurfaceId } from '../../../tools/browser-test/e2e/types';
import { APP_MESSAGE_HANDLER_NAME, MessageType } from '../../../Extension/src/common/messages/constants';

import { getSurface } from './e2e-helpers';

/**
 * Timeout for waiting for a DOM element to appear, in milliseconds.
 */
export const SELECTOR_WAIT_TIMEOUT_MS = 30_000;

/**
 * Timeout for beforeAll hooks, in milliseconds.
 * Must not exceed vitest.config.ts hookTimeout (120_000).
 */
export const BEFORE_ALL_TIMEOUT_MS = 120_000;

/**
 * Polling interval for checking UI state after an async operation.
 */
export const POLL_INTERVAL_MS = 250;

/**
 * Timeout for waiting for a mutation (delete/undo/toggle/save) to be
 * reflected in the UI or the background storage.
 */
export const MUTATION_TIMEOUT_MS = 15_000;

/**
 * Selector for the options page root that indicates the page has rendered.
 */
export const OPTIONS_PAGE_READY_SELECTOR = '#root .page';

/**
 * Selector for the undo button inside a notification.
 * The notification uses global (non-hashed) CSS classes.
 */
export const UNDO_BUTTON_SELECTOR = '.notification__content button[role="link"]';

/**
 * Selector for delete buttons on rule rows.
 * The aria-label is the translated i18n message for
 * `options_user_rules_delete_rule`, which is "Delete rule" in English.
 */
export const DELETE_BUTTON_SELECTOR = 'button[aria-label="Delete rule"]';

/**
 * Browser-context: saves user rules via the extension messaging API.
 * Must be evaluated on an extension page (e.g. options), NOT on the
 * background service worker — the SW cannot send messages to itself.
 *
 * @param args Object with `handlerName`, `messageType` and `rules`.
 */
export const saveUserRules = async (args: unknown) => {
    const { handlerName, messageType, rules } = args as {
        handlerName: string;
        messageType: string;
        rules: string;
    };
    return new Promise<void>((resolve, reject) => {
        chrome.runtime.sendMessage(
            {
                handlerName,
                type: messageType,
                data: { value: rules },
            },
            () => {
                const runtimeError = chrome.runtime.lastError;
                if (runtimeError) {
                    reject(new Error(runtimeError.message));
                    return;
                }
                resolve();
            },
        );
    });
};

/**
 * Browser-context: retrieves user rules via the extension messaging API.
 * Must be evaluated on an extension page (e.g. options), NOT on the
 * background service worker.
 *
 * @param args Object with `handlerName` and `messageType`.
 *
 * @returns The user rules text.
 */
export const getUserRules = async (args: unknown): Promise<string> => {
    const { handlerName, messageType } = args as {
        handlerName: string;
        messageType: string;
    };
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
            {
                handlerName,
                type: messageType,
            },
            (response: { userRules?: string } | undefined) => {
                const runtimeError = chrome.runtime.lastError;
                if (runtimeError) {
                    reject(new Error(runtimeError.message));
                    return;
                }
                resolve(response?.userRules ?? '');
            },
        );
    });
};

/**
 * Browser-context: navigates the options page to the user-filter section
 * by setting the hash.
 */
export const navigateToUserFilter = () => {
    // Value inlined — do not reference Node-scope variables here.
    window.location.hash = '#/user-filter';
};

/**
 * Browser-context: clicks a delete button by index.
 * Waits for the button to be enabled (not disabled by isSaving) before clicking.
 *
 * @param args Object with `selector` (CSS selector for delete buttons) and
 * `index` (zero-based index of the button to click).
 *
 * @returns Diagnostic info about the click outcome.
 */
export const clickDeleteButtonByIndex = async (
    args: unknown,
): Promise<{ clicked: boolean; wasDisabled: boolean; buttonsFound: number }> => {
    const { selector, index } = args as { selector: string; index: number };
    // Poll until the button is enabled (isSaving may be true briefly
    // after a previous mutation).
    const maxWait = 10_000;
    const startedAt = Date.now();
    while (Date.now() - startedAt < maxWait) {
        const buttons = document.querySelectorAll(selector);
        if (buttons.length > index) {
            const btn = buttons[index] as HTMLButtonElement;
            if (!btn.disabled) {
                btn.click();
                return { clicked: true, wasDisabled: false, buttonsFound: buttons.length };
            }
        }
        await new Promise((resolve) => {
            setTimeout(resolve, 100);
        });
    }
    // Fallback: click even if disabled.
    const buttons = document.querySelectorAll(selector);
    if (buttons.length > index) {
        (buttons[index] as HTMLElement).click();
        return { clicked: true, wasDisabled: true, buttonsFound: buttons.length };
    }
    return { clicked: false, wasDisabled: false, buttonsFound: buttons.length };
};

/**
 * Saves user rules by opening a temporary options page, sending the save
 * message from the page context, then closing the page.
 * Extension pages can send messages to the background; the background
 * service worker cannot send messages to itself.
 *
 * @param session E2E session.
 * @param entry E2E matrix entry.
 * @param rules Rules text to save.
 */
export const saveUserRulesViaPage = async (
    session: E2ESession,
    entry: E2EMatrixEntry,
    rules: string,
): Promise<void> => {
    const surface = getSurface(E2ESurfaceId.Options);
    const page = await openE2ESurface(session, entry, surface);
    try {
        await page.waitForSelector(OPTIONS_PAGE_READY_SELECTOR, SELECTOR_WAIT_TIMEOUT_MS);
        await page.evaluate(saveUserRules, {
            handlerName: APP_MESSAGE_HANDLER_NAME,
            messageType: MessageType.SaveUserRules,
            rules,
        });
    } finally {
        await page.close();
    }
};

/**
 * Reads user rules by evaluating the get-user-rules message on the
 * given page context.
 *
 * @param page E2E page handle (must be an extension page).
 *
 * @returns The user rules text.
 */
export const getUserRulesViaPage = async (page: E2EPageHandle): Promise<string> => {
    return page.evaluate(getUserRules, {
        handlerName: APP_MESSAGE_HANDLER_NAME,
        messageType: MessageType.GetUserRulesEditorData,
    });
};

/**
 * Opens the options page, waits for it to render, and navigates to the
 * user-filter section. The caller is responsible for closing the page.
 *
 * @param session E2E session.
 * @param entry E2E matrix entry.
 *
 * @returns E2E page handle positioned on the user-filter section.
 */
export const openUserFilterPage = async (
    session: E2ESession,
    entry: E2EMatrixEntry,
): Promise<E2EPageHandle> => {
    const surface = getSurface(E2ESurfaceId.Options);
    const page = await openE2ESurface(session, entry, surface);
    await page.waitForSelector(OPTIONS_PAGE_READY_SELECTOR, SELECTOR_WAIT_TIMEOUT_MS);
    await page.evaluate(navigateToUserFilter);
    return page;
};

/**
 * Polls until the delete button count matches the expected value or
 * the timeout is reached.
 *
 * @param page E2E page handle.
 * @param expected Expected number of delete buttons.
 * @param timeoutMs Timeout in milliseconds.
 *
 * @returns The final delete button count (may not match expected if timed out).
 */
export const waitForDeleteButtonCount = async (
    page: E2EPageHandle,
    expected: number,
    timeoutMs = MUTATION_TIMEOUT_MS,
): Promise<number> => {
    const startedAt = Date.now();
    let count = 0;
    while (Date.now() - startedAt < timeoutMs) {
        count = await page.querySelectorCount(DELETE_BUTTON_SELECTOR);
        if (count === expected) {
            return count;
        }
        await new Promise((resolve) => {
            setTimeout(resolve, POLL_INTERVAL_MS);
        });
    }
    return count;
};

/**
 * Polls the background user rules until the predicate matches or the
 * timeout is reached.
 *
 * @param page E2E page handle (must be an extension page).
 * @param predicate Predicate applied to the rules text on each poll.
 * @param timeoutMs Timeout in milliseconds.
 *
 * @returns The last read rules text (may not match predicate if timed out).
 */
export const waitForUserRules = async (
    page: E2EPageHandle,
    predicate: (rules: string) => boolean,
    timeoutMs = MUTATION_TIMEOUT_MS,
): Promise<string> => {
    const startedAt = Date.now();
    let rules = '';
    while (Date.now() - startedAt < timeoutMs) {
        rules = await getUserRulesViaPage(page);
        if (predicate(rules)) {
            return rules;
        }
        await new Promise((resolve) => {
            setTimeout(resolve, POLL_INTERVAL_MS);
        });
    }
    return rules;
};
