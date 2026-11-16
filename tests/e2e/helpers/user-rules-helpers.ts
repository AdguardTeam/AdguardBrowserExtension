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
 * Selector for the row Edit (pencil) action button.
 * The aria-label is the translated i18n message for
 * `options_user_rules_edit_rule`, which is "Edit rule" in English.
 */
export const EDIT_BUTTON_SELECTOR = 'button[aria-label="Edit rule"]';

/**
 * Marker prefixed to a rule line when it is toggled off in the list view.
 * Mirrors DISABLED_RULE_MARKER in
 * Extension/src/pages/options/components/UserRules/rule-parser.ts.
 */
export const DISABLED_RULE_MARKER = '!off ';

/**
 * Selector for the inline editor's content element (rules and comments).
 */
export const INLINE_EDITOR_SELECTOR = '.editor--inline .cm-content';

/**
 * Selector for the inline comment editor's content element.
 */
export const INLINE_COMMENT_EDITOR_SELECTOR = '.editor--inline-multiline .cm-content';

/**
 * Selector for the inline Save (tick) button.
 * The aria-label is the translated i18n message for
 * `options_user_rules_save_rule`, which is "Save rule" in English.
 */
export const INLINE_SAVE_BUTTON_SELECTOR = 'button[aria-label="Save rule"]';

/**
 * Selector for the inline Cancel (cross) button.
 * The aria-label is the translated i18n message for
 * `options_user_rules_cancel_rule_editing`, which is "Cancel rule editing" in English.
 */
export const INLINE_CANCEL_BUTTON_SELECTOR = 'button[aria-label="Cancel rule editing"]';

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
            (response: unknown) => {
                const runtimeError = chrome.runtime.lastError;
                if (runtimeError) {
                    reject(new Error(runtimeError.message));
                    return;
                }
                // A throwing background handler comes back through
                // webextension-polyfill as a normal reply carrying this flag,
                // so it must be treated as a rejection too.
                const rejection = response as {
                    __mozWebExtensionPolyfillReject__?: boolean;
                    message?: string;
                } | undefined;
                if (rejection?.__mozWebExtensionPolyfillReject__) {
                    reject(new Error(rejection.message ?? 'Background handler rejected the message'));
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
                // See `saveUserRules`: webextension-polyfill delivers a
                // throwing background handler as a flagged reply.
                const rejection = response as {
                    __mozWebExtensionPolyfillReject__?: boolean;
                    message?: string;
                } | undefined;
                if (rejection?.__mozWebExtensionPolyfillReject__) {
                    reject(new Error(rejection.message ?? 'Background handler rejected the message'));
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
 * Polls until the inline editor content element is present.
 *
 * @param page E2E page handle (must be an extension page).
 * @param selector CSS selector of the editor content element.
 * @param timeoutMs Timeout in milliseconds.
 */
export const waitForInlineEditor = async (
    page: E2EPageHandle,
    selector = INLINE_EDITOR_SELECTOR,
    timeoutMs = SELECTOR_WAIT_TIMEOUT_MS,
): Promise<void> => {
    await page.waitForSelector(selector, timeoutMs);
};

/**
 * Browser-context: polls until the target element is present and enabled, then
 * clicks it. The target is either the element matching `selector` at `index`,
 * or the `<button>` whose trimmed text equals `text`.
 *
 * Must stay self-contained: `page.evaluate` serializes only this function's
 * source, so it cannot reference Node-scope constants — the timeout and the
 * polling interval are passed via `args`.
 *
 * @param args Object with the target (`selector`, optional `index`, optional
 * `text`), `timeoutMs` and `intervalMs`.
 *
 * @returns Diagnostic info about the click outcome.
 */
export const clickElementWhenEnabled = async (args: unknown): Promise<{
    clicked: boolean;
    found: boolean;
    wasDisabled: boolean;
}> => {
    const {
        selector,
        index,
        text,
        timeoutMs,
        intervalMs,
    } = args as {
        selector?: string;
        index?: number;
        text?: string;
        timeoutMs: number;
        intervalMs: number;
    };

    /**
     * Finds the current target element among the mounted elements.
     */
    const findTarget = (): HTMLButtonElement | undefined => {
        if (text !== undefined) {
            return Array.from(document.querySelectorAll('button'))
                .find((candidate) => candidate.textContent?.trim() === text);
        }

        return document.querySelectorAll<HTMLButtonElement>(selector ?? '')[index ?? 0];
    };

    const startedAt = Date.now();
    while (Date.now() - startedAt < timeoutMs) {
        const target = findTarget();
        if (target && !target.disabled) {
            target.click();
            return { clicked: true, found: true, wasDisabled: false };
        }

        await new Promise((resolve) => {
            setTimeout(resolve, intervalMs);
        });
    }

    const target = findTarget();
    return { clicked: false, found: target !== undefined, wasDisabled: target?.disabled ?? false };
};

/**
 * Clicks the Edit (pencil) button at the given index among the mounted rows.
 * Polls until the button exists and is enabled (it is disabled briefly while a
 * mutation is saving).
 *
 * @param page E2E page handle (must be an extension page).
 * @param index Zero-based index among mounted edit buttons.
 *
 * @returns Whether the button was found and clicked.
 */
export const clickEditButtonByIndex = async (page: E2EPageHandle, index: number): Promise<boolean> => {
    const outcome = await page.evaluate(clickElementWhenEnabled, {
        selector: EDIT_BUTTON_SELECTOR,
        index,
        timeoutMs: MUTATION_TIMEOUT_MS,
        intervalMs: POLL_INTERVAL_MS,
    });

    return outcome.clicked;
};

/**
 * Browser-context: returns the current text content of the inline editor.
 *
 * @param arg CSS selector of the editor content element.
 *
 * @returns The editor's text content (empty string when absent).
 */
export const getInlineEditorText = (arg: unknown): string => {
    const selector = arg as string;
    return document.querySelector(selector)?.textContent ?? '';
};

/**
 * Browser-context: whether the caret drawn by the inline editor lies inside
 * the editor's box. The editor clips its content, so a caret outside the box
 * is not painted.
 *
 * Must stay self-contained: `page.evaluate` serializes only this function's
 * source.
 *
 * @param arg Selector of the inline editor's content element.
 *
 * @returns True when the caret is displayed and inside the editor's box.
 */
export const isInlineEditorCaretInsideEditor = (arg: unknown): boolean => {
    const selector = arg as string;
    const editor = document.querySelector(selector)?.closest('.editor--inline');
    const caret = editor?.querySelector('.cm-cursor');
    if (!editor || !caret) {
        return false;
    }

    const editorRect = editor.getBoundingClientRect();
    const caretRect = caret.getBoundingClientRect();

    // A hidden caret (the editor is not focused) has an empty rect.
    return caretRect.height > 0
        && caretRect.left >= editorRect.left
        && caretRect.right <= editorRect.right;
};

/**
 * Browser-context: whether the inline editor shows its line of text at full
 * height. A horizontal scrollbar that takes space inside the editor leaves
 * less than a line for the text.
 *
 * Must stay self-contained: `page.evaluate` serializes only this function's
 * source.
 *
 * @param arg Selector of the inline editor's content element.
 *
 * @returns True when the editor's visible area is at least one line tall.
 */
export const isInlineEditorLineFullyVisible = (arg: unknown): boolean => {
    const selector = arg as string;
    const content = document.querySelector(selector);
    const scroller = content?.closest('.cm-scroller');
    const line = content?.querySelector('.cm-line');
    if (!scroller || !line) {
        return false;
    }

    return scroller.clientHeight >= line.getBoundingClientRect().height;
};

/**
 * Vertical centres of the parts of a rule row, in CSS pixels from the top of
 * the page.
 */
export type RuleRowPartCentres = {
    /**
     * Centre of the checkbox.
     */
    checkbox: number;

    /**
     * Centre of the rule type icon.
     */
    icon: number;

    /**
     * Centre of the line of rule text.
     */
    text: number;
};

/**
 * Browser-context: measures where the checkbox, the type icon and the text of
 * the first rule row sit vertically.
 *
 * Must stay self-contained: `page.evaluate` serializes only this function's
 * source.
 *
 * @returns Centres of the row's parts, or null when the row is not rendered.
 */
export const getFirstRuleRowPartCentres = (): RuleRowPartCentres | null => {
    const checkbox = document.querySelector('div[data-index] input[type="checkbox"]');
    const container = checkbox?.parentElement;
    const icon = container?.querySelector('svg');
    const text = container?.querySelector('span');
    if (!checkbox || !icon || !text) {
        return null;
    }

    const centre = (element: Element): number => {
        const rect = element.getBoundingClientRect();
        return rect.top + rect.height / 2;
    };

    return {
        checkbox: centre(checkbox),
        icon: centre(icon),
        text: centre(text),
    };
};

/**
 * Visible label of the "Create rule" button. It has no stable aria-label, so
 * the browser-context helper matches it by text.
 */
const CREATE_RULE_BUTTON_TEXT = 'Create rule';

/**
 * Clicks the "Create rule" button (matched by its visible label) once it is
 * enabled. Polls because the button is disabled until the rules are loaded and
 * while user rules are off.
 *
 * @param page E2E page handle (must be an extension page).
 *
 * @returns Whether the button was found and clicked.
 */
export const clickCreateRuleButton = async (page: E2EPageHandle): Promise<boolean> => {
    const outcome = await page.evaluate(clickElementWhenEnabled, {
        text: CREATE_RULE_BUTTON_TEXT,
        timeoutMs: MUTATION_TIMEOUT_MS,
        intervalMs: POLL_INTERVAL_MS,
    });

    return outcome.clicked;
};

/**
 * Clicks the first enabled element matching the selector via JS. Unlike a
 * WebDriver click, a JS click is not intercepted by transient overlays (e.g.
 * the saving loader) that briefly cover the element.
 *
 * @param page E2E page handle (must be an extension page).
 * @param selector CSS selector of the element to click.
 *
 * @returns Whether the element was found and clicked.
 */
export const clickBySelector = async (page: E2EPageHandle, selector: string): Promise<boolean> => {
    const outcome = await page.evaluate(clickElementWhenEnabled, {
        selector,
        timeoutMs: MUTATION_TIMEOUT_MS,
        intervalMs: POLL_INTERVAL_MS,
    });

    return outcome.clicked;
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
