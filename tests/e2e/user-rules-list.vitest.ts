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
    DISABLED_RULE_MARKER,
    EDIT_BUTTON_SELECTOR,
    INLINE_COMMENT_EDITOR_SELECTOR,
    SELECTOR_WAIT_TIMEOUT_MS,
    UNDO_BUTTON_SELECTOR,
    clickBySelector,
    clickDeleteButtonByIndex,
    clickEditButtonByIndex,
    getFirstRuleRowPartCentres,
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
 * Number of lines in the comment block used by the virtualization test.
 */
const HUGE_COMMENT_LINE_COUNT = 5000;

/**
 * Comment line index the test scrolls to inside the huge block.
 */
const TARGET_COMMENT_LINE_INDEX = 980;

/**
 * A comment block large enough to be rendered through the nested line
 * virtualizer (the virtualization threshold is 100 lines).
 */
const HUGE_COMMENT_BLOCK = Array.from(
    { length: HUGE_COMMENT_LINE_COUNT },
    (_, index) => `! e2e huge comment line ${index}`,
).join('\n');

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
 * Selector for the View/Edit mode toggle button when the list is open.
 * The aria-label is the translated i18n message for
 * `options_user_rules_switch_to_editor`, which is "Switch to editor view".
 */
const SWITCH_TO_EDITOR_SELECTOR = 'button[aria-label="Switch to editor view"]';

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

            it('keeps the checkbox, the icon and the text of a rule on one line', async () => {
                const session = getE2ESession(e2eSession);

                await saveUserRulesViaPage(session, entry, BASE_RULES);
                const page = await openUserFilterPage(session, entry);

                try {
                    await page.waitForSelector(DELETE_BUTTON_SELECTOR, SELECTOR_WAIT_TIMEOUT_MS);

                    const centres = await page.evaluate(getFirstRuleRowPartCentres);
                    if (centres === null) {
                        throw new Error('The first rule row is not rendered');
                    }

                    // The 20px checkbox is centred on the 24px icon.
                    expect(Math.abs(centres.checkbox - centres.icon)).toBeLessThan(0.5);
                    // The text line is centred on them to within a pixel: its
                    // glyphs, not its box, are what the mockup centres.
                    expect(Math.abs(centres.text - centres.icon)).toBeLessThanOrEqual(1);
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

                    // The Create rule button opens an inline create row; the
                    // full editor is reached through the view-mode toggle. This
                    // test keeps covering the full-editor save path.
                    logInfo('[user-rules-list] Clicking switch to editor view');
                    expect(await clickBySelector(page, SWITCH_TO_EDITOR_SELECTOR)).toBe(true);

                    // Wait for the CodeMirror editor to mount.
                    await page.waitForSelector(EDITOR_CONTENT_SELECTOR, SELECTOR_WAIT_TIMEOUT_MS);

                    // Surround the rule with newlines so it lands on its own
                    // line regardless of where the editor caret is.
                    logInfo('[user-rules-list] Typing new rule text');
                    await page.typeText(EDITOR_CONTENT_SELECTOR, `\n${CREATED_RULE}\n`);

                    // Save the editor content. Use a JS click — the saving
                    // loader overlay can briefly intercept WebDriver clicks.
                    logInfo('[user-rules-list] Clicking Save');
                    expect(await clickBySelector(page, SAVE_BUTTON_SELECTOR)).toBe(true);

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
                    expect(await clickBySelector(page, SWITCH_TO_LIST_SELECTOR)).toBe(true);
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

        describe('user rules list comment block virtualization', () => {
            it('renders only the visible lines of a huge comment block', async () => {
                const session = getE2ESession(e2eSession);

                logInfo('[user-rules-list] Saving rules with a huge comment block');
                await saveUserRulesViaPage(session, entry, `${BASE_RULES}\n${HUGE_COMMENT_BLOCK}`);

                logInfo('[user-rules-list] Opening user-filter page');
                const page = await openUserFilterPage(session, entry);

                try {
                    await page.waitForSelector(EDIT_BUTTON_SELECTOR, SELECTOR_WAIT_TIMEOUT_MS);

                    // Only the visible slice of the 5000-line block is mounted.
                    // (The lines are `span[data-index]`; the list rows are
                    // `div[data-index]`.) The block starts near the fold of the
                    // initial viewport, so the slice is small either way — the
                    // point is that it is bounded by the viewport, not by the
                    // block size.
                    let lineCount = await page.evaluate(
                        () => document.querySelectorAll('span[data-index]').length,
                    );
                    expect(lineCount).toBeGreaterThan(0);
                    expect(lineCount).toBeLessThan(300);

                    const hasLastLine = await page.evaluate(
                        () => document.body.textContent?.includes('e2e huge comment line 4999') ?? false,
                    );
                    expect(hasLastLine).toBe(false);

                    // Scrolling deep into the block mounts the later lines and
                    // unmounts the ones left above. The block is the 4th row,
                    // after the 3 baseline rules; derive the target from its
                    // measured geometry instead of a hard-coded offset, so a
                    // layout change above the list cannot shift the expected
                    // line out of the overscan window.
                    const targetScrollTop = await page.evaluate((arg) => {
                        const { rowIndex, lineIndex, lineCount } = arg as {
                            rowIndex: number;
                            lineIndex: number;
                            lineCount: number;
                        };
                        const blockRow = document.querySelector(`div[data-index="${rowIndex}"]`);
                        if (!blockRow) {
                            return null;
                        }

                        const rect = blockRow.getBoundingClientRect();
                        return rect.top + window.scrollY + (rect.height * lineIndex) / lineCount;
                    }, {
                        rowIndex: 3,
                        lineIndex: TARGET_COMMENT_LINE_INDEX,
                        lineCount: HUGE_COMMENT_LINE_COUNT,
                    });
                    expect(targetScrollTop).not.toBeNull();

                    await page.evaluate((target) => {
                        window.scrollTo(0, target as number);
                    }, targetScrollTop);
                    await page.waitForSelector(
                        `span[data-index="${TARGET_COMMENT_LINE_INDEX}"]`,
                        SELECTOR_WAIT_TIMEOUT_MS,
                    );

                    lineCount = await page.evaluate(
                        () => document.querySelectorAll('span[data-index]').length,
                    );
                    // Now the block fills the viewport, so the slice is larger
                    // but still bounded by the viewport height.
                    expect(lineCount).toBeGreaterThan(5);
                    expect(lineCount).toBeLessThan(300);

                    const hasFirstLine = await page.evaluate(
                        () => document.body.textContent?.includes('e2e huge comment line 0') ?? false,
                    );
                    expect(hasFirstLine).toBe(false);

                    // Scrolling back to the top restores the first lines, and
                    // the block stays one editing unit: its edit button opens
                    // the inline editor for the whole block.
                    await page.evaluate(() => {
                        window.scrollTo(0, 0);
                    });
                    await page.waitForSelector('span[data-index="0"]', SELECTOR_WAIT_TIMEOUT_MS);

                    lineCount = await page.evaluate(
                        () => document.querySelectorAll('span[data-index]').length,
                    );
                    expect(lineCount).toBeGreaterThan(0);
                    expect(lineCount).toBeLessThan(300);

                    // The block is the 4th row, after the 3 baseline rules.
                    expect(await clickEditButtonByIndex(page, 3)).toBe(true);
                    await page.waitForSelector(INLINE_COMMENT_EDITOR_SELECTOR, SELECTOR_WAIT_TIMEOUT_MS);

                    const pageErrors = await page.getErrors();
                    expectNoErrors(pageErrors, `${entry.id}/comment-block page errors`);

                    const bgErrors = await page.getBackgroundErrors();
                    expectNoErrors(bgErrors, `${entry.id}/comment-block background errors`);
                } finally {
                    await page.close();
                }
            });
        });
    });
});
