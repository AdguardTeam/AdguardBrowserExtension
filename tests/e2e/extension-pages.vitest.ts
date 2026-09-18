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
import { BENIGN_ERROR_PATTERNS, filterBenignErrors } from '../../tools/browser-test/e2e/benign-errors';
import {
    type E2ESession,
    closeE2ESession,
    launchE2ESession,
    openE2ESurface,
} from '../../tools/browser-test/e2e/session';
import { E2ESpecialSurfaceId, E2ESurfaceId } from '../../tools/browser-test/e2e/types';

import {
    expectNoErrors,
    getE2EEnv,
    getE2EMatrix,
    getE2ESession,
    getSurface,
} from './helpers/e2e-helpers';

const e2eEnv = getE2EEnv();
const e2eMatrix = getE2EMatrix();

logSection(`E2E tests (${e2eEnv})`);
logInfo(`Selected matrix: ${e2eMatrix.map((entry) => entry.id).join(', ')}`);

e2eMatrix.forEach((entry) => {
    describe(entry.id, () => {
        let e2eSession: E2ESession | undefined;

        beforeAll(async () => {
            logInfo(`[${entry.id}] unpacking ${e2eEnv} artifact`);

            const extensionPath = await unpackE2EArtifact(entry, e2eEnv);

            e2eSession = await launchE2ESession(entry, extensionPath);
        });

        afterAll(async () => {
            if (!e2eSession) {
                return;
            }

            await closeE2ESession(e2eSession);
        });

        describe(E2ESurfaceId.Popup, () => {
            it('renders page', async () => {
                const surface = getSurface(E2ESurfaceId.Popup);
                const page = await openE2ESurface(getE2ESession(e2eSession), entry, surface);

                try {
                    expect(await page.querySelectorCount('#root > *')).toBeGreaterThan(0);

                    const pageErrors = await page.getErrors();
                    expectNoErrors(pageErrors, `${entry.id}/${surface.id} page errors`);

                    const bgErrors = await page.getBackgroundErrors();
                    expectNoErrors(bgErrors, `${entry.id}/${surface.id} background errors`);
                } finally {
                    await page.close();
                }
            });
        });

        describe(E2ESurfaceId.Options, () => {
            it('renders page', async () => {
                const surface = getSurface(E2ESurfaceId.Options);
                const page = await openE2ESurface(getE2ESession(e2eSession), entry, surface);

                try {
                    await page.waitForSelector('#root .page');
                    expect(await page.querySelectorCount('#root .page')).toBeGreaterThan(0);

                    const pageErrors = await page.getErrors();
                    expectNoErrors(pageErrors, `${entry.id}/${surface.id} page errors`);

                    const bgErrors = await page.getBackgroundErrors();
                    expectNoErrors(bgErrors, `${entry.id}/${surface.id} background errors`);
                } finally {
                    await page.close();
                }
            });

            it.each(['category', 'search'])('AG-55699 inactive switches in %s', async (view) => {
                const surface = getSurface(E2ESurfaceId.Options);
                let page = await openE2ESurface(getE2ESession(e2eSession), entry, surface);
                const groupSelector = 'input[id="1"]';
                const filterSelector = 'input[id="filter-2"]';
                const pollOptions = { timeout: 15_000, interval: 100 };

                const readSwitch = (selector: string) => page.evaluate((arg) => {
                    const input = document.querySelector<HTMLInputElement>(arg as string);
                    if (!input) {
                        throw new Error(`Switch missing: ${arg}`);
                    }
                    const label = input.nextElementSibling;
                    if (!label) {
                        throw new Error(`Switch label missing: ${arg}`);
                    }
                    return {
                        checked: input.checked,
                        disabled: input.disabled,
                        color: getComputedStyle(label, '::after').backgroundColor,
                        knob: getComputedStyle(label, '::before').transform,
                    };
                }, selector);

                const readFilterContent = () => page.evaluate(() => {
                    const row = document.getElementById('filter-2')?.closest('.filter-wrapper');
                    if (!row) {
                        throw new Error('Base filter row missing');
                    }
                    return ['.filter__title', '.filter__desc', '.filter__link', '.filter__tags'].map((selector) => {
                        const element = row.querySelector(selector);
                        if (!element) {
                            throw new Error(`Filter content missing: ${selector}`);
                        }
                        let effectiveOpacity = 1;
                        for (let ancestor: Element | null = element; ancestor; ancestor = ancestor.parentElement) {
                            effectiveOpacity *= Number(getComputedStyle(ancestor).opacity);
                        }
                        const style = getComputedStyle(element);
                        return { color: style.color, effectiveOpacity, pointerEvents: style.pointerEvents };
                    });
                });

                const setChecked = async (selector: string, checked: boolean) => {
                    await expect.poll(async () => (await readSwitch(selector)).disabled, pollOptions).toBe(false);
                    if ((await readSwitch(selector)).checked !== checked) {
                        await page.clickSelector(`${selector} + label`);
                    }
                    await expect.poll(async () => {
                        const state = await readSwitch(selector);
                        return { checked: state.checked, disabled: state.disabled };
                    }, pollOptions).toEqual({ checked, disabled: false });
                };

                try {
                    await page.waitForSelector('#root .page');
                    await page.evaluate(() => {
                        window.location.hash = '#/filters?group=1';
                    });
                    await page.waitForSelector(filterSelector);
                    await setChecked(groupSelector, true);
                    await setChecked(filterSelector, true);
                    await expect.poll(async () => (await readSwitch(filterSelector)).knob, pollOptions)
                        .toBe('matrix(1, 0, 0, 1, 38, 18)');
                    const active = await readSwitch(filterSelector);
                    const activeContent = await readFilterContent();
                    const filterName = await page.evaluate(() => {
                        const title = document.getElementById('filter-2-title');
                        if (!title?.textContent) {
                            throw new Error('Base filter title missing');
                        }
                        return title.textContent.trim();
                    });

                    // Explicitly disabling establishes a touched group before child edits.
                    await setChecked(groupSelector, false);
                    await expect.poll(async () => (await readSwitch(groupSelector)).color, pollOptions)
                        .toBe('rgb(192, 192, 192)');

                    if (view === 'search') {
                        await page.evaluate(() => {
                            window.location.hash = '#/filters';
                        });
                        await expect.poll(() => page.querySelectorCount(filterSelector), pollOptions).toBe(0);
                        await page.waitForSelector('#search__input');
                        await page.typeText('#search__input', filterName);
                        await page.waitForSelector(filterSelector);
                    }

                    // Computed color alone misses ancestor opacity: compare effective row rendering too.
                    await expect.poll(readFilterContent, pollOptions).toEqual(activeContent);
                    expect((await readSwitch(filterSelector)).disabled).toBe(false);
                    await expect.poll(() => readSwitch(filterSelector), pollOptions).toEqual({
                        checked: true,
                        disabled: false,
                        color: 'rgb(164, 164, 164)',
                        knob: active.knob,
                    });

                    await setChecked(filterSelector, false);
                    await expect.poll(readFilterContent, pollOptions).toEqual(activeContent);
                    await expect.poll(async () => (await readSwitch(filterSelector)).color, pollOptions)
                        .toBe('rgb(192, 192, 192)');
                    await expect.poll(async () => (await readSwitch(filterSelector)).knob, pollOptions)
                        .not.toBe(active.knob);
                    expect((await readSwitch(groupSelector)).checked).toBe(false);

                    await setChecked(filterSelector, true);
                    expect((await readSwitch(groupSelector)).checked).toBe(false);
                    await expect.poll(async () => (await readSwitch(filterSelector)).color, pollOptions)
                        .toBe('rgb(164, 164, 164)');

                    if (view === 'search') {
                        await setChecked(groupSelector, true);
                        await expect.poll(() => readSwitch(filterSelector), pollOptions).toEqual(active);
                        await expect.poll(readFilterContent, pollOptions).toEqual(activeContent);
                        await setChecked(groupSelector, false);
                        await expect.poll(async () => (await readSwitch(filterSelector)).color, pollOptions)
                            .toBe('rgb(164, 164, 164)');
                        await expect.poll(readFilterContent, pollOptions).toEqual(activeContent);
                    }

                    // Reopening verifies saved state independently of the previous React tree.
                    expectNoErrors(await page.getErrors(), `${entry.id}/${view} filter switch errors before reopen`);
                    await page.close();
                    page = await openE2ESurface(getE2ESession(e2eSession), entry, surface);
                    await page.waitForSelector('#root .page');
                    await page.evaluate(() => {
                        window.location.hash = '#/filters?group=1';
                    });
                    await page.waitForSelector(filterSelector);
                    await expect.poll(() => readSwitch(filterSelector), pollOptions).toEqual({
                        checked: true,
                        disabled: false,
                        color: 'rgb(164, 164, 164)',
                        knob: active.knob,
                    });
                    expect((await readSwitch(groupSelector)).checked).toBe(false);

                    await setChecked(groupSelector, true);
                    await expect.poll(() => readSwitch(filterSelector), pollOptions).toEqual(active);
                    await expect.poll(async () => (await readSwitch(groupSelector)).color, pollOptions)
                        .toBe(active.color);
                    expectNoErrors(await page.getErrors(), `${entry.id}/${view} filter switch errors`);
                } finally {
                    await page.close();
                }
            });

            it.each([
                ['stealth', 'stealth-disable-stealth-mode'],
                ['allowlist', 'allowlist-enabled'],
                ['user-filter', 'user-filter-enabled'],
                ['miscellaneous', 'hits-count-disabled'],
            ])('AG-55699 preserves ordinary switches in %s', async (route, id) => {
                const surface = getSurface(E2ESurfaceId.Options);
                const page = await openE2ESurface(getE2ESession(e2eSession), entry, surface);
                const selector = `input[id="${id}"]`;
                const pollOptions = { timeout: 15_000, interval: 100 };
                let initialChecked: boolean | undefined;

                const readSwitch = () => page.evaluate((arg) => {
                    const input = document.querySelector<HTMLInputElement>(arg as string);
                    if (!input?.nextElementSibling) {
                        throw new Error(`Switch missing: ${arg}`);
                    }
                    const label = input.nextElementSibling;
                    return {
                        checked: input.checked,
                        disabled: input.disabled,
                        color: getComputedStyle(label, '::after').backgroundColor,
                        knob: getComputedStyle(label, '::before').transform,
                    };
                }, selector);

                const setChecked = async (checked: boolean) => {
                    await expect.poll(async () => (await readSwitch()).disabled, pollOptions).toBe(false);
                    if ((await readSwitch()).checked !== checked) {
                        await page.clickSelector(`${selector} + label`);
                    }
                    await expect.poll(readSwitch, pollOptions).toEqual({
                        checked,
                        disabled: false,
                        color: checked ? 'rgb(103, 178, 121)' : 'rgb(192, 192, 192)',
                        knob: checked ? 'matrix(1, 0, 0, 1, 38, 18)' : 'matrix(1, 0, 0, 1, 18, 18)',
                    });
                };

                try {
                    await page.waitForSelector('#root .page');
                    await page.evaluate((arg) => {
                        window.location.hash = `#/${arg as string}`;
                    }, route);
                    await page.waitForSelector(selector);
                    initialChecked = (await readSwitch()).checked;
                    await setChecked(true);
                    await setChecked(false);
                    await setChecked(true);
                } finally {
                    try {
                        if (initialChecked !== undefined) {
                            await setChecked(initialChecked);
                        }
                        expectNoErrors(await page.getErrors(), `${entry.id}/${route} ordinary switch errors`);
                    } finally {
                        await page.close();
                    }
                }
            });
        });

        describe(E2ESurfaceId.FilteringLog, () => {
            it('renders page', async () => {
                const surface = getSurface(E2ESurfaceId.FilteringLog);
                const page = await openE2ESurface(getE2ESession(e2eSession), entry, surface);

                try {
                    expect(await page.querySelectorCount('#root > *')).toBeGreaterThan(0);

                    const pageErrors = await page.getErrors();
                    expectNoErrors(pageErrors, `${entry.id}/${surface.id} page errors`);

                    const bgErrors = await page.getBackgroundErrors();
                    expectNoErrors(bgErrors, `${entry.id}/${surface.id} background errors`);
                } finally {
                    await page.close();
                }
            });
        });

        describe(E2ESpecialSurfaceId.Background, () => {
            it('has no errors', () => {
                const session = getE2ESession(e2eSession);
                const allErrors = session.session.backgroundErrors.getErrors();
                const errors = filterBenignErrors(allErrors, BENIGN_ERROR_PATTERNS);

                expectNoErrors(errors, `${entry.id} background errors`);
            });
        });
    });
});
