/**
 * Copyright (c) 2015-2026 Adguard Software Ltd.
 *
 * @file E2E tests for basic user rules list/editor flows: toggling a rule,
 * deleting a rule, and creating a rule via the editor.
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
} from '../../tools/browser-test/e2e/session';

import {
    expectNoErrors,
    getE2EEnv,
    getE2EMatrix,
    getE2ESession,
} from './helpers/e2e-helpers';
import {
    BEFORE_ALL_TIMEOUT_MS,
    DELETE_BUTTON_SELECTOR,
    SELECTOR_WAIT_TIMEOUT_MS,
    UNDO_BUTTON_SELECTOR,
    clickDeleteButtonByIndex,
    openUserFilterPage,
    saveUserRulesViaPage,
    waitForDeleteButtonCount,
    waitForUserRules,
} from './helpers/user-rules-helpers';

const e2eEnv = getE2EEnv();
const e2eMatrix = getE2EMatrix();

logSection(`E2E user rules list tests (${e2eEnv})`);
logInfo(`Selected matrix: ${e2eMatrix.map((entry) => entry.id).join(', ')}`);

/**
 * Baseline rules used across the tests in this file.
 */
const BASE_RULES = [
    '||one.example^',
    '||two.example^',
    '||three.example^',
].join('\n');

/**
 * Rule text inserted through the editor in the create-rule test.
 */
const CREATED_RULE = '||created.example^';

/**
 * Marker prefixed to a rule line when it is toggled off in the list view.
 * Mirrors DISABLED_RULE_MARKER in
 * Extension/src/pages/options/components/UserRules/rule-parser.ts.
 */
const DISABLED_RULE_MARKER = '!off ';

/**
 * Selector for the CodeMirror 6 content element inside the rules editor.
 */
const EDITOR_CONTENT_SELECTOR = '.editor .cm-content';

/**
 * Selector for the editor's Save button.
 */
const SAVE_BUTTON_SELECTOR = 'button.actions__btn--saving';

/**
 * Selector for the View/Edit mode toggle button when the editor is open.
 * The aria-label is the translated i18n message for
 * `options_user_rules_switch_to_list`, which is "Switch to list view".
 */
const SWITCH_TO_LIST_SELECTOR = 'button[aria-label="Switch to list view"]';

/**
 * Browser-context: clicks the "Create rule" button in the list view toolbar.
 * The button uses a hashed CSS-module class, so it is located by its
 * translated text content ("Create rule" in English).
 *
 * @returns Whether the button was found and clicked.
 */
const clickCreateRuleButton = (): boolean => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const createButton = buttons.find((button) => button.textContent?.trim() === 'Create rule');
    if (createButton) {
        createButton.click();
        return true;
    }
    return false;
};

/**
 * Browser-context: polls for an enabled element matching the selector and
 * clicks it via JS. Unlike a WebDriver click, a JS click is not intercepted
 * by transient overlays (e.g. the saving loader) that briefly cover the
 * element.
 *
 * @param arg CSS selector of the element to click.
 *
 * @returns Whether the element was found and clicked.
 */
const clickBySelector = async (arg: unknown): Promise<boolean> => {
    const selector = arg as string;
    const maxWait = 10_000;
    const startedAt = Date.now();
    while (Date.now() - startedAt < maxWait) {
        const el = document.querySelector<HTMLButtonElement>(selector);
        if (el && !el.disabled) {
            el.click();
            return true;
        }
        await new Promise((resolve) => {
            setTimeout(resolve, 100);
        });
    }
    return false;
};

/**
 * Browser-context: clicks the checkbox of the rule row with the given
 * aria-label (the rule's display text). Polls until the checkbox exists and
 * is enabled (it is disabled briefly while a previous mutation is saving).
 *
 * @param arg The rule display text used as the checkbox aria-label.
 *
 * @returns Diagnostic info about the click outcome.
 */
const clickRuleCheckbox = async (
    arg: unknown,
): Promise<{ clicked: boolean; found: boolean; wasDisabled: boolean }> => {
    const ruleText = arg as string;
    const selector = `input[type="checkbox"][aria-label="${ruleText}"]`;
    const maxWait = 10_000;
    const startedAt = Date.now();
    while (Date.now() - startedAt < maxWait) {
        const checkbox = document.querySelector<HTMLInputElement>(selector);
        if (checkbox && !checkbox.disabled) {
            checkbox.click();
            return { clicked: true, found: true, wasDisabled: false };
        }
        await new Promise((resolve) => {
            setTimeout(resolve, 100);
        });
    }
    const checkbox = document.querySelector<HTMLInputElement>(selector);
    return { clicked: false, found: checkbox !== null, wasDisabled: checkbox?.disabled ?? false };
};

e2eMatrix.forEach((entry) => {
    describe(entry.id, () => {
        let e2eSession: E2ESession | undefined;

        beforeAll(async () => {
            logInfo(`[user-rules-list] unpacking ${e2eEnv} artifact`);

            const extensionPath = await unpackE2EArtifact(entry, e2eEnv);

            e2eSession = await launchE2ESession(entry, extensionPath);
        }, BEFORE_ALL_TIMEOUT_MS);

        afterAll(async () => {
            if (!e2eSession) {
                return;
            }

            await closeE2ESession(e2eSession);
        });

        describe('user rules list basic flows', () => {
            it('deletes a rule from the list and persists the change', async () => {
                const session = getE2ESession(e2eSession);

                logInfo('[user-rules-list] Saving baseline rules');
                await saveUserRulesViaPage(session, entry, BASE_RULES);

                logInfo('[user-rules-list] Opening user-filter page');
                const page = await openUserFilterPage(session, entry);

                try {
                    await page.waitForSelector(DELETE_BUTTON_SELECTOR, SELECTOR_WAIT_TIMEOUT_MS);
                    let deleteButtonCount = await page.querySelectorCount(DELETE_BUTTON_SELECTOR);
                    expect(deleteButtonCount).toBe(3);

                    // Delete the middle rule (||two.example^).
                    logInfo('[user-rules-list] Deleting ||two.example^');
                    await page.evaluate(clickDeleteButtonByIndex, {
                        selector: DELETE_BUTTON_SELECTOR,
                        index: 1,
                    });

                    // The delete shows an undo notification; wait for it so we
                    // know the mutation has been persisted.
                    await page.waitForSelector(UNDO_BUTTON_SELECTOR, SELECTOR_WAIT_TIMEOUT_MS);
                    deleteButtonCount = await waitForDeleteButtonCount(page, 2);
                    expect(deleteButtonCount).toBe(2);

                    // Verify the deletion persisted to the background.
                    const rules = await waitForUserRules(
                        page,
                        (text) => !text.includes('||two.example^'),
                    );
                    expect(rules).toContain('||one.example^');
                    expect(rules).toContain('||three.example^');
                    expect(rules).not.toContain('||two.example^');

                    const pageErrors = await page.getErrors();
                    expectNoErrors(pageErrors, `${entry.id}/delete-rule page errors`);

                    const bgErrors = await page.getBackgroundErrors();
                    expectNoErrors(bgErrors, `${entry.id}/delete-rule background errors`);
                } finally {
                    await page.close();
                }
            });

            it('toggles a rule off and on again, persisting the disabled marker', async () => {
                const session = getE2ESession(e2eSession);

                logInfo('[user-rules-list] Saving baseline rules');
                await saveUserRulesViaPage(session, entry, BASE_RULES);

                logInfo('[user-rules-list] Opening user-filter page');
                const page = await openUserFilterPage(session, entry);

                try {
                    await page.waitForSelector(DELETE_BUTTON_SELECTOR, SELECTOR_WAIT_TIMEOUT_MS);

                    // Toggle ||two.example^ off.
                    logInfo('[user-rules-list] Toggling ||two.example^ off');
                    const toggledOff = await page.evaluate(clickRuleCheckbox, '||two.example^');
                    logInfo(`[user-rules-list] Toggle off result: ${JSON.stringify(toggledOff)}`);
                    expect(toggledOff.clicked).toBe(true);

                    // The toggle save is debounced; poll the background until
                    // the disabled marker is persisted.
                    const rulesAfterOff = await waitForUserRules(
                        page,
                        (text) => text.includes(`${DISABLED_RULE_MARKER}||two.example^`),
                    );
                    expect(rulesAfterOff).toContain(`${DISABLED_RULE_MARKER}||two.example^`);

                    // Toggle it back on. The aria-label stays the display text
                    // (without the marker), so the same selector applies.
                    logInfo('[user-rules-list] Toggling ||two.example^ back on');
                    const toggledOn = await page.evaluate(clickRuleCheckbox, '||two.example^');
                    logInfo(`[user-rules-list] Toggle on result: ${JSON.stringify(toggledOn)}`);
                    expect(toggledOn.clicked).toBe(true);

                    const rulesAfterOn = await waitForUserRules(
                        page,
                        (text) => !text.includes(DISABLED_RULE_MARKER),
                    );
                    expect(rulesAfterOn).toContain('||two.example^');
                    expect(rulesAfterOn).not.toContain(DISABLED_RULE_MARKER);

                    const pageErrors = await page.getErrors();
                    expectNoErrors(pageErrors, `${entry.id}/toggle-rule page errors`);

                    const bgErrors = await page.getBackgroundErrors();
                    expectNoErrors(bgErrors, `${entry.id}/toggle-rule background errors`);
                } finally {
                    await page.close();
                }
            });

            it('creates a new rule via the editor and saves it', async () => {
                const session = getE2ESession(e2eSession);

                logInfo('[user-rules-list] Saving baseline rules');
                await saveUserRulesViaPage(session, entry, BASE_RULES);

                logInfo('[user-rules-list] Opening user-filter page');
                const page = await openUserFilterPage(session, entry);

                try {
                    await page.waitForSelector(DELETE_BUTTON_SELECTOR, SELECTOR_WAIT_TIMEOUT_MS);

                    // Open the editor seeded with the current rules and the
                    // cursor on a trailing blank line.
                    logInfo('[user-rules-list] Clicking Create rule');
                    const createClicked = await page.evaluate(clickCreateRuleButton);
                    expect(createClicked).toBe(true);

                    // Wait for the CodeMirror editor to mount.
                    await page.waitForSelector(EDITOR_CONTENT_SELECTOR, SELECTOR_WAIT_TIMEOUT_MS);

                    // Type the new rule at the cursor position (trailing blank
                    // line prepared by the Create rule handler). Real key
                    // events are required — CodeMirror ignores synthetic DOM
                    // mutations in some browsers.
                    logInfo('[user-rules-list] Typing new rule text');
                    await page.typeText(EDITOR_CONTENT_SELECTOR, CREATED_RULE);

                    // Save the editor content. Use a JS click — the saving
                    // loader overlay can briefly intercept WebDriver clicks.
                    logInfo('[user-rules-list] Clicking Save');
                    const saveClicked = await page.evaluate(clickBySelector, SAVE_BUTTON_SELECTOR);
                    expect(saveClicked).toBe(true);

                    // Verify the new rule persisted alongside the baseline.
                    const rules = await waitForUserRules(
                        page,
                        (text) => text.includes(CREATED_RULE),
                    );
                    expect(rules).toContain('||one.example^');
                    expect(rules).toContain('||two.example^');
                    expect(rules).toContain('||three.example^');
                    expect(rules).toContain(CREATED_RULE);

                    // Switch back to the list view (content is saved, so no
                    // leave-confirmation modal appears) and verify the new
                    // rule row is rendered.
                    logInfo('[user-rules-list] Switching back to list view');
                    const switchClicked = await page.evaluate(clickBySelector, SWITCH_TO_LIST_SELECTOR);
                    expect(switchClicked).toBe(true);
                    const deleteButtonCount = await waitForDeleteButtonCount(page, 4);
                    expect(deleteButtonCount).toBe(4);

                    const pageErrors = await page.getErrors();
                    expectNoErrors(pageErrors, `${entry.id}/create-rule page errors`);

                    const bgErrors = await page.getBackgroundErrors();
                    expectNoErrors(bgErrors, `${entry.id}/create-rule background errors`);
                } finally {
                    await page.close();
                }
            });
        });
    });
});
