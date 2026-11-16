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

import { logInfo, logSection } from '../../tools/browser-test/logger';
import { unpackE2EArtifact } from '../../tools/browser-test/e2e/artifacts';
import {
    type E2ESession,
    closeE2ESession,
    launchE2ESession,
} from '../../tools/browser-test/e2e/session';
import { E2EKey, type E2EPageHandle } from '../../tools/browser-test/e2e/page-handle';
import { type E2EMatrixEntry } from '../../tools/browser-test/e2e/types';

import {
    expectNoErrors,
    getE2EEnv,
    getE2EMatrix,
    getE2ESession,
} from './helpers/e2e-helpers';
import {
    BEFORE_ALL_TIMEOUT_MS,
    DISABLED_RULE_MARKER,
    EDIT_BUTTON_SELECTOR,
    INLINE_CANCEL_BUTTON_SELECTOR,
    INLINE_COMMENT_EDITOR_SELECTOR,
    INLINE_EDITOR_SELECTOR,
    INLINE_SAVE_BUTTON_SELECTOR,
    MUTATION_TIMEOUT_MS,
    SELECTOR_WAIT_TIMEOUT_MS,
    UNDO_BUTTON_SELECTOR,
    clickBySelector,
    clickCreateRuleButton,
    clickEditButtonByIndex,
    getInlineEditorText,
    getUserRulesViaPage,
    isInlineEditorCaretInsideEditor,
    isInlineEditorLineFullyVisible,
    openUserFilterPage,
    saveUserRulesViaPage,
    waitForInlineEditor,
    waitForUserRules,
} from './helpers/user-rules-helpers';

const e2eEnv = getE2EEnv();
const e2eMatrix = getE2EMatrix();

logSection(`E2E inline rule editing tests (${e2eEnv})`);
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
 * Platform-specific save chord. The rules editor binds save to `Mod-s`, and
 * CodeMirror resolves `Mod` from the browser's platform. The E2E browser runs
 * on the same host as Node, so `process.platform` selects the matching chord.
 */
const SAVE_CHORD: E2EKey = process.platform === 'darwin' ? E2EKey.MetaS : E2EKey.ControlS;

/**
 * Platform-specific select-all chord. CodeMirror's default select-all is
 * `Mod-a`, resolved from the browser's platform; the E2E browser shares the
 * Node host.
 */
const SELECT_ALL_CHORD: E2EKey = process.platform === 'darwin' ? E2EKey.MetaA : E2EKey.ControlA;

/**
 * Poll options for waiting on async UI/mutation state. The Vitest poll default
 * (1s) is too short for a save round-trip in slower CI environments.
 */
const POLL_OPTIONS = { timeout: MUTATION_TIMEOUT_MS, interval: 100 };

/**
 * Inline save actions covered by the save tests. Each case edits a different
 * row and saves with a different interaction.
 */
const SAVE_CASES: Array<{
    /**
     * Test title fragment.
     */
    title: string;

    /**
     * Error-context label fragment.
     */
    label: string;

    /**
     * Zero-based index of the row to edit.
     */
    index: number;

    /**
     * Replacement rule text.
     */
    rule: string;

    /**
     * Rule that must be gone after the save.
     */
    removedRule: string;

    /**
     * Save action.
     */
    save: (page: E2EPageHandle) => Promise<void>;
}> = [
    {
        title: 'the Enter hotkey',
        label: 'enter-save',
        index: 1,
        rule: '||edited.example^',
        removedRule: '||two.example^',
        save: async (page) => {
            await page.pressKey(INLINE_EDITOR_SELECTOR, E2EKey.Enter);
        },
    },
    {
        title: 'the tick button',
        label: 'tick-save',
        index: 1,
        rule: '||edited.example^',
        removedRule: '||two.example^',
        save: async (page) => {
            expect(await clickBySelector(page, INLINE_SAVE_BUTTON_SELECTOR)).toBe(true);
        },
    },
    {
        title: 'the Ctrl/Cmd+S hotkey',
        label: 'hotkey-save',
        index: 2,
        rule: '||hotkey.example^',
        removedRule: '||three.example^',
        save: async (page) => {
            await page.pressKey(INLINE_EDITOR_SELECTOR, SAVE_CHORD);
        },
    },
];

/**
 * Seeds the given rules, opens the user-filter page, starts inline editing of
 * the row at `index` and waits for the editor to mount.
 *
 * @param session E2E session.
 * @param entry E2E matrix entry.
 * @param rules Rules text to seed.
 * @param index Zero-based index of the row to edit.
 * @param editorSelector CSS selector of the expected editor content element.
 *
 * @returns The opened user-filter page; the caller closes it.
 */
const openInlineEditor = async (
    session: E2ESession,
    entry: E2EMatrixEntry,
    rules: string,
    index: number,
    editorSelector = INLINE_EDITOR_SELECTOR,
): Promise<E2EPageHandle> => {
    await saveUserRulesViaPage(session, entry, rules);
    const page = await openUserFilterPage(session, entry);
    await page.waitForSelector(EDIT_BUTTON_SELECTOR, SELECTOR_WAIT_TIMEOUT_MS);
    expect(await clickEditButtonByIndex(page, index)).toBe(true);
    await waitForInlineEditor(page, editorSelector);
    return page;
};

e2eMatrix.forEach((entry) => {
    describe(entry.id, () => {
        let e2eSession: E2ESession | undefined;
        let keepAlivePage: E2EPageHandle | undefined;

        beforeAll(async () => {
            logInfo(`[inline-rule-editing] unpacking ${e2eEnv} artifact`);

            const extensionPath = await unpackE2EArtifact(entry, e2eEnv);

            e2eSession = await launchE2ESession(entry, extensionPath);

            const session = getE2ESession(e2eSession);

            // Warm up the background before the first asserted test. On MV3 the
            // first user-rules save after a fresh service-worker start can race
            // with engine initialization and fail with "Data is not set!"
            // (string-storage.ts) or with a DNR duplicate-id error. This is a
            // known product race tracked as AG-61506; the throwaway save absorbs
            // the one-time failure. Best-effort: failures are ignored because
            // the warm-up asserts nothing.
            try {
                await saveUserRulesViaPage(session, entry, '');
            } catch (error: unknown) {
                logInfo(`[inline-rule-editing] warm-up save failed (ignored): ${String(error)}`);
            }

            // Keep one options page open for the whole suite so the MV3 service
            // worker does not suspend between tests — waking it again races the
            // same engine initialization on the next save.
            keepAlivePage = await openUserFilterPage(session, entry);
        }, BEFORE_ALL_TIMEOUT_MS);

        afterAll(async () => {
            await keepAlivePage?.close();

            if (!e2eSession) {
                return;
            }

            await closeE2ESession(e2eSession);
        });

        describe('inline rule editing', () => {
            it.each(SAVE_CASES)('saves an edited rule with $title', async ({
                label,
                index,
                rule,
                removedRule,
                save,
            }) => {
                const session = getE2ESession(e2eSession);
                const page = await openInlineEditor(session, entry, BASE_RULES, index);

                try {
                    await page.pressKey(INLINE_EDITOR_SELECTOR, SELECT_ALL_CHORD);
                    await page.typeText(INLINE_EDITOR_SELECTOR, rule);
                    await save(page);

                    const rules = await waitForUserRules(
                        page,
                        (text) => text.includes(rule),
                    );
                    expect(rules).toContain(rule);
                    expect(rules).not.toContain(removedRule);

                    expectNoErrors(await page.getErrors(), `${entry.id}/${label} page errors`);
                    expectNoErrors(
                        await page.getBackgroundErrors(),
                        `${entry.id}/${label} background errors`,
                    );
                } finally {
                    await page.close();
                }
            });

            it('shows the saved rule after reopening the page', async () => {
                const session = getE2ESession(e2eSession);
                const persistedRuleCheckboxSelector = 'input[type="checkbox"][aria-label="||persisted.example^"]';
                let page = await openInlineEditor(session, entry, BASE_RULES, 0);

                try {
                    await page.pressKey(INLINE_EDITOR_SELECTOR, SELECT_ALL_CHORD);
                    await page.typeText(INLINE_EDITOR_SELECTOR, '||persisted.example^');
                    await page.pressKey(INLINE_EDITOR_SELECTOR, E2EKey.Enter);
                    await waitForUserRules(page, (text) => text.includes('||persisted.example^'));

                    expectNoErrors(await page.getErrors(), `${entry.id}/reopen-before page errors`);
                    expectNoErrors(
                        await page.getBackgroundErrors(),
                        `${entry.id}/reopen-before background errors`,
                    );

                    // Reopen the page: the list re-fetches from the background
                    // and must render the saved rule.
                    await page.close();
                    page = await openUserFilterPage(session, entry);
                    await page.waitForSelector(persistedRuleCheckboxSelector, SELECTOR_WAIT_TIMEOUT_MS);
                    expect(await page.querySelectorCount(persistedRuleCheckboxSelector)).toBe(1);

                    expectNoErrors(await page.getErrors(), `${entry.id}/reopen-after page errors`);
                    expectNoErrors(
                        await page.getBackgroundErrors(),
                        `${entry.id}/reopen-after background errors`,
                    );
                } finally {
                    await page.close();
                }
            });

            it('cancels inline editing with Escape without persisting', async () => {
                const session = getE2ESession(e2eSession);
                const page = await openInlineEditor(session, entry, BASE_RULES, 1);

                try {
                    await page.pressKey(INLINE_EDITOR_SELECTOR, SELECT_ALL_CHORD);
                    await page.typeText(INLINE_EDITOR_SELECTOR, '||discarded.example^');
                    await page.pressKey(INLINE_EDITOR_SELECTOR, E2EKey.Escape);

                    // The editor is gone and the stored text is unchanged.
                    await expect.poll(
                        () => page.querySelectorCount(INLINE_EDITOR_SELECTOR),
                        POLL_OPTIONS,
                    ).toBe(0);
                    const rules = await getUserRulesViaPage(page);
                    expect(rules).toContain('||two.example^');
                    expect(rules).not.toContain('||discarded.example^');

                    expectNoErrors(await page.getErrors(), `${entry.id}/escape-cancel page errors`);
                    expectNoErrors(
                        await page.getBackgroundErrors(),
                        `${entry.id}/escape-cancel background errors`,
                    );
                } finally {
                    await page.close();
                }
            });

            it('cancels inline editing with the cross button without persisting', async () => {
                const session = getE2ESession(e2eSession);
                const page = await openInlineEditor(session, entry, BASE_RULES, 1);

                try {
                    await page.pressKey(INLINE_EDITOR_SELECTOR, SELECT_ALL_CHORD);
                    await page.typeText(INLINE_EDITOR_SELECTOR, '||discarded.example^');
                    await clickBySelector(page, INLINE_CANCEL_BUTTON_SELECTOR);

                    await expect.poll(
                        () => page.querySelectorCount(INLINE_EDITOR_SELECTOR),
                        POLL_OPTIONS,
                    ).toBe(0);
                    const rules = await getUserRulesViaPage(page);
                    expect(rules).toContain('||two.example^');
                    expect(rules).not.toContain('||discarded.example^');

                    expectNoErrors(await page.getErrors(), `${entry.id}/cross-cancel page errors`);
                    expectNoErrors(
                        await page.getBackgroundErrors(),
                        `${entry.id}/cross-cancel background errors`,
                    );
                } finally {
                    await page.close();
                }
            });

            it('deletes a rule by saving an empty value and restores it with Undo', async () => {
                const session = getE2ESession(e2eSession);
                const page = await openInlineEditor(session, entry, BASE_RULES, 1);

                try {
                    await page.pressKey(INLINE_EDITOR_SELECTOR, SELECT_ALL_CHORD);
                    await page.pressKey(INLINE_EDITOR_SELECTOR, E2EKey.Backspace);
                    await clickBySelector(page, INLINE_SAVE_BUTTON_SELECTOR);

                    const deleted = await waitForUserRules(
                        page,
                        (text) => !text.includes('||two.example^'),
                    );
                    expect(deleted).not.toContain('||two.example^');
                    expect(deleted).toContain('||one.example^');
                    expect(deleted).toContain('||three.example^');

                    // The delete shows an undo notification; click it.
                    await page.waitForSelector(UNDO_BUTTON_SELECTOR, SELECTOR_WAIT_TIMEOUT_MS);
                    await page.clickSelector(UNDO_BUTTON_SELECTOR);

                    const restored = await waitForUserRules(
                        page,
                        (text) => text.includes('||two.example^'),
                    );
                    expect(restored).toContain('||two.example^');

                    expectNoErrors(await page.getErrors(), `${entry.id}/empty-delete page errors`);
                    expectNoErrors(
                        await page.getBackgroundErrors(),
                        `${entry.id}/empty-delete background errors`,
                    );
                } finally {
                    await page.close();
                }
            });

            it('edits a single-line comment inline and restores its marker', async () => {
                const session = getE2ESession(e2eSession);
                const page = await openInlineEditor(
                    session,
                    entry,
                    '! first comment\n||one.example^',
                    0,
                    INLINE_COMMENT_EDITOR_SELECTOR,
                );

                try {
                    await page.pressKey(INLINE_COMMENT_EDITOR_SELECTOR, SELECT_ALL_CHORD);
                    await page.typeText(INLINE_COMMENT_EDITOR_SELECTOR, 'second comment');
                    await page.pressKey(INLINE_COMMENT_EDITOR_SELECTOR, E2EKey.Enter);

                    const rules = await waitForUserRules(
                        page,
                        (text) => text.includes('! second comment'),
                    );
                    expect(rules).toContain('! second comment');
                    expect(rules).not.toContain('first comment');

                    expectNoErrors(await page.getErrors(), `${entry.id}/comment-single page errors`);
                    expectNoErrors(
                        await page.getBackgroundErrors(),
                        `${entry.id}/comment-single background errors`,
                    );
                } finally {
                    await page.close();
                }
            });

            it('adds a line to a multi-line comment block with Shift+Enter', async () => {
                const session = getE2ESession(e2eSession);
                const page = await openInlineEditor(
                    session,
                    entry,
                    '! first line\n! second line\n||one.example^',
                    0,
                    INLINE_COMMENT_EDITOR_SELECTOR,
                );

                try {
                    await page.pressKey(INLINE_COMMENT_EDITOR_SELECTOR, SELECT_ALL_CHORD);
                    await page.typeText(INLINE_COMMENT_EDITOR_SELECTOR, 'updated first');
                    await page.pressKey(INLINE_COMMENT_EDITOR_SELECTOR, E2EKey.ShiftEnter);
                    await page.typeText(INLINE_COMMENT_EDITOR_SELECTOR, 'added line');
                    await page.pressKey(INLINE_COMMENT_EDITOR_SELECTOR, E2EKey.Enter);

                    const rules = await waitForUserRules(
                        page,
                        (text) => text.includes('! added line'),
                    );
                    expect(rules).toContain('! updated first');
                    expect(rules).toContain('! added line');

                    expectNoErrors(await page.getErrors(), `${entry.id}/comment-multiline page errors`);
                    expectNoErrors(
                        await page.getBackgroundErrors(),
                        `${entry.id}/comment-multiline background errors`,
                    );
                } finally {
                    await page.close();
                }
            });

            it('deletes a comment block by saving an empty value and restores it with Undo', async () => {
                const session = getE2ESession(e2eSession);
                const page = await openInlineEditor(
                    session,
                    entry,
                    '! first line\n! second line\n||one.example^',
                    0,
                    INLINE_COMMENT_EDITOR_SELECTOR,
                );

                try {
                    await page.pressKey(INLINE_COMMENT_EDITOR_SELECTOR, SELECT_ALL_CHORD);
                    await page.pressKey(INLINE_COMMENT_EDITOR_SELECTOR, E2EKey.Backspace);
                    await clickBySelector(page, INLINE_SAVE_BUTTON_SELECTOR);

                    const deleted = await waitForUserRules(
                        page,
                        (text) => !text.includes('first line'),
                    );
                    expect(deleted).not.toContain('first line');
                    expect(deleted).not.toContain('second line');

                    await page.waitForSelector(UNDO_BUTTON_SELECTOR, SELECTOR_WAIT_TIMEOUT_MS);
                    await page.clickSelector(UNDO_BUTTON_SELECTOR);

                    const restored = await waitForUserRules(
                        page,
                        (text) => text.includes('first line'),
                    );
                    expect(restored).toContain('first line');
                    expect(restored).toContain('second line');

                    expectNoErrors(await page.getErrors(), `${entry.id}/comment-delete page errors`);
                    expectNoErrors(
                        await page.getBackgroundErrors(),
                        `${entry.id}/comment-delete background errors`,
                    );
                } finally {
                    await page.close();
                }
            });

            it('keeps the edited row mounted and the draft when it scrolls out of view', async () => {
                const session = getE2ESession(e2eSession);

                // A long rule at index 5, surrounded by filler rules so the list
                // is tall enough to scroll.
                const filler = Array.from({ length: 40 }, (_, i) => `||filler${i}.example^`);
                const longRule = `||${'a'.repeat(400)}.example^`;
                filler[5] = longRule;
                const page = await openInlineEditor(session, entry, filler.join('\n'), 5);

                try {
                    await page.pressKey(INLINE_EDITOR_SELECTOR, E2EKey.End);
                    await page.typeText(INLINE_EDITOR_SELECTOR, '-edited');

                    // Scroll far down. The range extractor keeps the edited row
                    // mounted (it is the click-blocking boundary), so the editor
                    // must stay in the DOM even when it leaves the viewport.
                    await page.evaluate(async () => {
                        const nextFrame = (): Promise<void> => new Promise((resolve) => {
                            requestAnimationFrame(() => resolve());
                        });

                        // Typing leaves a pending "scroll the cursor into view"
                        // in the editor. It is applied on the editor's next
                        // measure: in the next animation frame, or earlier, on
                        // a scroll event. A scroll issued in the same frame as
                        // the last keystroke would be undone by it, so let
                        // that frame pass first, as it does for a real user.
                        await nextFrame();

                        document.documentElement.style.setProperty('overflow-anchor', 'none');
                        document.body.style.setProperty('overflow-anchor', 'none');
                        window.scrollTo(0, document.body.scrollHeight);

                        // Let the scroll listeners (the editor, the list
                        // virtualizer) run, so the position read below is the
                        // settled one.
                        await nextFrame();
                        await nextFrame();
                    });
                    await expect.poll(
                        () => page.querySelectorCount(INLINE_EDITOR_SELECTOR),
                        POLL_OPTIONS,
                    ).toBe(1);
                    const isEditorOutOfView = await page.evaluate((selector) => {
                        const editor = document.querySelector(selector as string);
                        if (!editor) {
                            return false;
                        }
                        const rect = editor.getBoundingClientRect();
                        return rect.bottom < 0 || rect.top > window.innerHeight;
                    }, INLINE_EDITOR_SELECTOR);
                    expect(isEditorOutOfView).toBe(true);

                    const draft = await page.evaluate(getInlineEditorText, INLINE_EDITOR_SELECTOR);
                    expect(draft).toContain('-edited');

                    await page.pressKey(INLINE_EDITOR_SELECTOR, E2EKey.Enter);
                    const rules = await waitForUserRules(
                        page,
                        (text) => text.includes('-edited'),
                    );
                    expect(rules).toContain('-edited');

                    expectNoErrors(await page.getErrors(), `${entry.id}/scroll-draft page errors`);
                    expectNoErrors(
                        await page.getBackgroundErrors(),
                        `${entry.id}/scroll-draft background errors`,
                    );
                } finally {
                    await page.close();
                }
            });

            it('shows the text of a long rule while editing it', async () => {
                const session = getE2ESession(e2eSession);

                // Longer than the row, so the single-line editor has to scroll
                // horizontally.
                const longRule = `||${'a'.repeat(400)}.example^`;
                const page = await openInlineEditor(session, entry, [longRule, BASE_RULES].join('\n'), 0);

                try {
                    // Where scrollbars take space, a horizontal one must not
                    // cover the editor's only line.
                    await expect.poll(
                        () => page.evaluate(isInlineEditorLineFullyVisible, INLINE_EDITOR_SELECTOR),
                        POLL_OPTIONS,
                    ).toBe(true);

                    expectNoErrors(await page.getErrors(), `${entry.id}/long-rule page errors`);
                    expectNoErrors(
                        await page.getBackgroundErrors(),
                        `${entry.id}/long-rule background errors`,
                    );
                } finally {
                    await page.close();
                }
            });

            it('returns focus to the pencil after cancelling', async () => {
                const session = getE2ESession(e2eSession);
                const page = await openInlineEditor(session, entry, BASE_RULES, 0);

                const focusedLabel = () => {
                    return page.evaluate(() => document.activeElement?.getAttribute('aria-label') ?? '');
                };

                try {
                    await page.pressKey(INLINE_EDITOR_SELECTOR, E2EKey.Escape);
                    await expect.poll(focusedLabel, POLL_OPTIONS).toBe('Edit rule');

                    expectNoErrors(await page.getErrors(), `${entry.id}/focus-cancel page errors`);
                    expectNoErrors(
                        await page.getBackgroundErrors(),
                        `${entry.id}/focus-cancel background errors`,
                    );
                } finally {
                    await page.close();
                }
            });

            it('leaves the row interactive again after saving', async () => {
                const session = getE2ESession(e2eSession);
                const page = await openInlineEditor(session, entry, BASE_RULES, 1);

                try {
                    await page.pressKey(INLINE_EDITOR_SELECTOR, SELECT_ALL_CHORD);
                    await page.typeText(INLINE_EDITOR_SELECTOR, '||focus.example^');
                    await page.pressKey(INLINE_EDITOR_SELECTOR, E2EKey.Enter);
                    await waitForUserRules(page, (text) => text.includes('||focus.example^'));

                    // The editor is closed and the row's pencil is present and
                    // enabled again.
                    //
                    // NOTE: focus restoration after a *save* is not observable
                    // in a real browser — the row's deferred restore races the
                    // mutation's refetch and is dropped, leaving focus on
                    // <body>. That is a product defect outside this test-only
                    // task's scope; focus restoration after *cancel* is asserted
                    // in the previous test.
                    await expect.poll(() => page.evaluate((selector) => {
                        const btn = document.querySelectorAll<HTMLButtonElement>(selector as string)[1];
                        return {
                            editorCount: document.querySelectorAll('.editor--inline').length,
                            buttonPresent: btn !== undefined,
                            buttonDisabled: btn?.disabled ?? null,
                        };
                    }, EDIT_BUTTON_SELECTOR), POLL_OPTIONS).toEqual({
                        editorCount: 0,
                        buttonPresent: true,
                        buttonDisabled: false,
                    });

                    expectNoErrors(await page.getErrors(), `${entry.id}/focus-save page errors`);
                    expectNoErrors(
                        await page.getBackgroundErrors(),
                        `${entry.id}/focus-save background errors`,
                    );
                } finally {
                    await page.close();
                }
            });

            it('ignores outside clicks while editing and does not cancel on blur', async () => {
                const session = getE2ESession(e2eSession);
                const page = await openInlineEditor(session, entry, BASE_RULES, 0);

                const searchInputSelector = 'input[aria-label="Search"]';
                const secondRuleCheckboxSelector = 'input[type="checkbox"][aria-label="||two.example^"]';

                /**
                 * Whether focus is still inside the inline editor.
                 */
                const isFocusInInlineEditor = () => page.evaluate(
                    () => document.querySelector('.editor--inline')?.contains(document.activeElement) ?? false,
                );

                try {
                    const draft = await page.evaluate(getInlineEditorText, INLINE_EDITOR_SELECTOR);
                    expect(draft).toBe('||one.example^');

                    // Click the search input: the capture-phase blocker must
                    // prevent focus/typing.
                    await page.clickSelector(searchInputSelector);
                    expect(await isFocusInInlineEditor()).toBe(true);
                    const searchValue = await page.evaluate(
                        (selector) => document.querySelector<HTMLInputElement>(selector as string)?.value ?? '',
                        searchInputSelector,
                    );
                    expect(searchValue).toBe('');

                    // Click another row's pencil: editing must not move.
                    expect(await clickEditButtonByIndex(page, 1)).toBe(true);
                    expect(await page.evaluate(getInlineEditorText, INLINE_EDITOR_SELECTOR))
                        .toBe('||one.example^');

                    // Click Create rule: the blocker must keep focus in the
                    // editor and no create row may open (still one editor).
                    expect(await clickCreateRuleButton(page)).toBe(true);
                    expect(await isFocusInInlineEditor()).toBe(true);
                    await expect.poll(
                        () => page.querySelectorCount(INLINE_EDITOR_SELECTOR),
                        POLL_OPTIONS,
                    ).toBe(1);

                    // Click another row's checkbox: it must stay checked (no toggle).
                    await page.clickSelector(secondRuleCheckboxSelector);
                    const checkboxChecked = await page.evaluate(
                        (selector) => document.querySelector<HTMLInputElement>(selector as string)?.checked ?? false,
                        secondRuleCheckboxSelector,
                    );
                    expect(checkboxChecked).toBe(true);

                    // Programmatic blur must not cancel editing (no blur handler).
                    await page.evaluate(() => {
                        (document.activeElement as HTMLElement | null)?.blur();
                    });
                    await expect.poll(
                        () => page.querySelectorCount(INLINE_EDITOR_SELECTOR),
                        POLL_OPTIONS,
                    ).toBe(1);

                    expectNoErrors(await page.getErrors(), `${entry.id}/outside-click page errors`);
                    expectNoErrors(
                        await page.getBackgroundErrors(),
                        `${entry.id}/outside-click background errors`,
                    );
                } finally {
                    await page.close();
                }
            });

            it('creates a new rule inline via the Create rule button', async () => {
                const session = getE2ESession(e2eSession);

                await saveUserRulesViaPage(session, entry, BASE_RULES);
                const page = await openUserFilterPage(session, entry);

                try {
                    await page.waitForSelector(EDIT_BUTTON_SELECTOR, SELECTOR_WAIT_TIMEOUT_MS);
                    expect(await clickCreateRuleButton(page)).toBe(true);
                    await waitForInlineEditor(page);
                    await page.typeText(INLINE_EDITOR_SELECTOR, '||created.example^');
                    await clickBySelector(page, INLINE_SAVE_BUTTON_SELECTOR);

                    const rules = await waitForUserRules(
                        page,
                        (text) => text.includes('||created.example^'),
                    );
                    expect(rules.split('\n')[0]).toBe('||created.example^');
                    await expect.poll(
                        () => page.querySelectorCount(INLINE_EDITOR_SELECTOR),
                        POLL_OPTIONS,
                    ).toBe(0);

                    expectNoErrors(await page.getErrors(), `${entry.id}/create-inline page errors`);
                    expectNoErrors(
                        await page.getBackgroundErrors(),
                        `${entry.id}/create-inline background errors`,
                    );
                } finally {
                    await page.close();
                }
            });

            it('shows the caret in an empty inline create row', async () => {
                const session = getE2ESession(e2eSession);

                await saveUserRulesViaPage(session, entry, BASE_RULES);
                const page = await openUserFilterPage(session, entry);

                try {
                    await page.waitForSelector(EDIT_BUTTON_SELECTOR, SELECTOR_WAIT_TIMEOUT_MS);
                    expect(await clickCreateRuleButton(page)).toBe(true);
                    await waitForInlineEditor(page);

                    // The caret is at the start of an empty line here, at the
                    // very edge of the editor's clipped box.
                    await expect.poll(
                        () => page.evaluate(isInlineEditorCaretInsideEditor, INLINE_EDITOR_SELECTOR),
                        POLL_OPTIONS,
                    ).toBe(true);

                    expectNoErrors(await page.getErrors(), `${entry.id}/create-caret page errors`);
                    expectNoErrors(
                        await page.getBackgroundErrors(),
                        `${entry.id}/create-caret background errors`,
                    );
                } finally {
                    await page.close();
                }
            });

            it('cancels the inline create row with Escape without creating a rule', async () => {
                const session = getE2ESession(e2eSession);

                await saveUserRulesViaPage(session, entry, BASE_RULES);
                const page = await openUserFilterPage(session, entry);

                try {
                    await page.waitForSelector(EDIT_BUTTON_SELECTOR, SELECTOR_WAIT_TIMEOUT_MS);
                    expect(await clickCreateRuleButton(page)).toBe(true);
                    await waitForInlineEditor(page);
                    await page.typeText(INLINE_EDITOR_SELECTOR, '||nope.example^');
                    await page.pressKey(INLINE_EDITOR_SELECTOR, E2EKey.Escape);

                    await expect.poll(
                        () => page.querySelectorCount(INLINE_EDITOR_SELECTOR),
                        POLL_OPTIONS,
                    ).toBe(0);
                    const rules = await getUserRulesViaPage(page);
                    expect(rules).not.toContain('||nope.example^');
                    expect(rules).toBe(BASE_RULES);

                    expectNoErrors(await page.getErrors(), `${entry.id}/create-escape page errors`);
                    expectNoErrors(
                        await page.getBackgroundErrors(),
                        `${entry.id}/create-escape background errors`,
                    );
                } finally {
                    await page.close();
                }
            });

            it('closes the inline create row on an empty save without creating a rule', async () => {
                const session = getE2ESession(e2eSession);

                await saveUserRulesViaPage(session, entry, BASE_RULES);
                const page = await openUserFilterPage(session, entry);

                try {
                    await page.waitForSelector(EDIT_BUTTON_SELECTOR, SELECTOR_WAIT_TIMEOUT_MS);

                    // Snackbars from earlier tests can linger; wait them out so
                    // the notification check below observes only this save.
                    await expect.poll(
                        () => page.querySelectorCount(UNDO_BUTTON_SELECTOR),
                        POLL_OPTIONS,
                    ).toBe(0);

                    expect(await clickCreateRuleButton(page)).toBe(true);
                    await waitForInlineEditor(page);
                    await clickBySelector(page, INLINE_SAVE_BUTTON_SELECTOR);

                    await expect.poll(
                        () => page.querySelectorCount(INLINE_EDITOR_SELECTOR),
                        POLL_OPTIONS,
                    ).toBe(0);
                    const rules = await getUserRulesViaPage(page);
                    expect(rules).toBe(BASE_RULES);
                    // No delete/undo notification for an empty create save.
                    expect(await page.querySelectorCount(UNDO_BUTTON_SELECTOR)).toBe(0);

                    expectNoErrors(await page.getErrors(), `${entry.id}/create-empty page errors`);
                    expectNoErrors(
                        await page.getBackgroundErrors(),
                        `${entry.id}/create-empty background errors`,
                    );
                } finally {
                    await page.close();
                }
            });

            it('keeps the !off marker when saving an edited disabled rule', async () => {
                const session = getE2ESession(e2eSession);
                // The disabled rule is rendered first; the edit button is
                // index 0 (disabled rules are ordinary rows).
                const page = await openInlineEditor(
                    session,
                    entry,
                    `${DISABLED_RULE_MARKER}||two.example^\n||one.example^`,
                    0,
                );

                try {
                    const seed = await page.evaluate(getInlineEditorText, INLINE_EDITOR_SELECTOR);
                    expect(seed).toBe('||two.example^');
                    await page.pressKey(INLINE_EDITOR_SELECTOR, SELECT_ALL_CHORD);
                    await page.typeText(INLINE_EDITOR_SELECTOR, '||edited.example^');
                    await page.pressKey(INLINE_EDITOR_SELECTOR, E2EKey.Enter);

                    const rules = await waitForUserRules(
                        page,
                        (text) => text.includes('||edited.example^'),
                    );
                    expect(rules).toContain(`${DISABLED_RULE_MARKER}||edited.example^`);

                    expectNoErrors(await page.getErrors(), `${entry.id}/disabled-marker page errors`);
                    expectNoErrors(
                        await page.getBackgroundErrors(),
                        `${entry.id}/disabled-marker background errors`,
                    );
                } finally {
                    await page.close();
                }
            });
        });
    });
});
