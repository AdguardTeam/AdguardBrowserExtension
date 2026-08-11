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
    beforeEach,
    describe,
    it,
    expect,
    vi,
} from 'vitest';

const { getHtmlRenderer, mountHighlightStyle } = vi.hoisted(() => ({
    getHtmlRenderer: vi.fn(),
    mountHighlightStyle: vi.fn(),
}));

vi.mock('@adguard/rules-editor', () => ({
    getHtmlRenderer,
    mountHighlightStyle,
}));

vi.mock(
    '../../../../../../Extension/src/pages/common/components/Editor/adguard-theme',
    () => ({ adguardHighlightStyle: { mock: 'style' } }),
);

vi.mock('../../../../../../Extension/src/common/logger', () => ({
    logger: { error: vi.fn() },
}));

const MODULE_PATH = '../../../../../../Extension/src/pages/options/components/UserRules/rule-highlighter';

describe('getRuleHighlighter', () => {
    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
    });

    it('initializes the renderer once and mounts the highlight style', async () => {
        const renderRule = vi.fn((rule: string) => `<span>${rule}</span>`);
        getHtmlRenderer.mockResolvedValue(renderRule);

        const { getRuleHighlighter } = await import(MODULE_PATH);
        const renderer = await getRuleHighlighter();

        expect(renderer).toBe(renderRule);
        expect(getHtmlRenderer).toHaveBeenCalledTimes(1);
        expect(mountHighlightStyle).toHaveBeenCalledTimes(1);
        expect(mountHighlightStyle).toHaveBeenCalledWith({ mock: 'style' });
    });

    it('configures the renderer with the editor highlight style so colors match the editor', async () => {
        const renderRule = vi.fn((rule: string) => rule);
        getHtmlRenderer.mockResolvedValue(renderRule);

        const { getRuleHighlighter } = await import(MODULE_PATH);
        await getRuleHighlighter();

        // The renderer MUST be built with the same `adguardHighlightStyle` the
        // CodeMirror editor uses (mocked here as `{ mock: 'style' }`), and the
        // same style MUST be mounted, so list colors match the editor exactly.
        expect(getHtmlRenderer).toHaveBeenCalledWith(
            expect.any(URL),
            { highlightStyle: { mock: 'style' } },
        );
        expect(mountHighlightStyle).toHaveBeenCalledWith({ mock: 'style' });
    });

    it('reuses the same renderer promise across calls (singleton)', async () => {
        const renderRule = vi.fn((rule: string) => rule);
        getHtmlRenderer.mockResolvedValue(renderRule);

        const { getRuleHighlighter } = await import(MODULE_PATH);
        const first = await getRuleHighlighter();
        const second = await getRuleHighlighter();

        expect(first).toBe(second);
        expect(getHtmlRenderer).toHaveBeenCalledTimes(1);
    });

    it('rejects when WASM initialization fails', async () => {
        getHtmlRenderer.mockRejectedValue(new Error('wasm boom'));

        const { getRuleHighlighter } = await import(MODULE_PATH);

        await expect(getRuleHighlighter()).rejects.toThrow('wasm boom');
    });

    it('retries initialization after a transient failure instead of staying stuck', async () => {
        const renderRule = vi.fn((rule: string) => rule);
        // First attempt fails, second attempt succeeds.
        getHtmlRenderer
            .mockRejectedValueOnce(new Error('transient'))
            .mockResolvedValueOnce(renderRule);

        const { getRuleHighlighter } = await import(MODULE_PATH);

        await expect(getRuleHighlighter()).rejects.toThrow('transient');

        // A later call must re-attempt initialization (cached rejected promise cleared).
        const renderer = await getRuleHighlighter();

        expect(renderer).toBe(renderRule);
        expect(getHtmlRenderer).toHaveBeenCalledTimes(2);
    });
});
