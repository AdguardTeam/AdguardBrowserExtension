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
    describe,
    expect,
    it,
    vi,
} from 'vitest';
import {
    Annotation,
    EditorState,
    StateEffect,
} from '@codemirror/state';
import { type EditorView, keymap } from '@codemirror/view';

import { createSingleLineExtensions } from '../../../../../../Extension/src/pages/common/components/Editor/single-line';

const createState = (onEnter: () => void = vi.fn()) => EditorState.create({
    doc: '',
    extensions: createSingleLineExtensions(onEnter),
});

describe('createSingleLineExtensions', () => {
    it('strips line terminators from inserted text', () => {
        const state = createState();
        const transaction = state.update({ changes: { from: 0, insert: 'a\nb\rc\r\nd' } });

        expect(transaction.state.doc.toString()).toBe('abcd');
    });

    it('flattens a multi-line paste into the current line', () => {
        const state = EditorState.create({
            doc: '||example.',
            extensions: createSingleLineExtensions(vi.fn()),
        });
        const transaction = state.update({
            changes: { from: 10, insert: 'com\n||other.com^' },
        });

        expect(transaction.state.doc.toString()).toBe('||example.com||other.com^');
    });

    it('keeps transactions without line terminators untouched', () => {
        const state = createState();
        const transaction = state.update({
            changes: { from: 0, insert: '||example.com^' },
            selection: { anchor: 14 },
        });

        expect(transaction.state.doc.toString()).toBe('||example.com^');
        expect(transaction.state.selection.main.head).toBe(14);
    });

    it('remaps an explicitly set selection over the removed line terminators', () => {
        const state = EditorState.create({
            doc: 'abc',
            extensions: createSingleLineExtensions(vi.fn()),
        });
        const transaction = state.update({
            changes: { from: 3, insert: 'X\nY' },
            // Pasting sets the caret after the pasted text.
            selection: { anchor: 6 },
        });

        expect(transaction.state.doc.toString()).toBe('abcXY');
        // The caret must stay after the flattened text, not before it.
        expect(transaction.state.selection.main.head).toBe(5);
    });

    it('preserves annotations, effects and scrollIntoView when flattening', () => {
        const state = createState();
        const annotation = Annotation.define<string>();
        const effect = StateEffect.define<number>();
        const transaction = state.update({
            changes: { from: 0, insert: 'a\nb' },
            annotations: annotation.of('test'),
            effects: effect.of(1),
            scrollIntoView: true,
        });

        expect(transaction.state.doc.toString()).toBe('ab');
        expect(transaction.annotation(annotation)).toBe('test');
        expect(transaction.effects.some((transactionEffect) => transactionEffect.is(effect))).toBe(true);
        expect(transaction.scrollIntoView).toBe(true);
    });

    it('saves on Enter and swallows the key', () => {
        const onEnter = vi.fn();
        const bindings = createState(onEnter).facet(keymap).flat();
        const enter = bindings.find((binding) => binding.key === 'Enter');

        expect(enter?.run).toBeTypeOf('function');
        expect(enter!.run!({} as unknown as EditorView)).toBe(true);
        expect(onEnter).toHaveBeenCalledTimes(1);
    });

    it('swallows Shift-Enter without saving', () => {
        const onEnter = vi.fn();
        const bindings = createState(onEnter).facet(keymap).flat();
        const shiftEnter = bindings.find((binding) => binding.key === 'Shift-Enter');

        expect(shiftEnter).toBeDefined();
        expect(shiftEnter!.run!({} as unknown as EditorView)).toBe(true);
        expect(onEnter).not.toHaveBeenCalled();
    });

    it.each([
        // Hardcoded so dropping a hotkey from `DISABLED_HOTKEYS` fails this
        // test instead of silently dropping its case too.
        'Mod-f',
        'Mod-h',
        'F3',
        'Shift-F3',
        'Mod-g',
        'Mod-Shift-g',
        'Mod-Alt-f',
        'Mod-l',
        'Mod-Alt-g',
        'Mod-/',
        'Alt-ArrowUp',
        'Alt-ArrowDown',
        'Shift-Alt-ArrowUp',
        'Shift-Alt-ArrowDown',
    ])('disables the %s hotkey', (key) => {
        const bindings = createState().facet(keymap).flat();
        const binding = bindings.find((candidate) => candidate.key === key);

        expect(binding).toBeDefined();
        expect(binding!.run!({} as unknown as EditorView)).toBe(true);
    });

    it.each([
        // Platform-scoped hotkeys must stay available on the other platforms,
        // where their built-in meaning is useful.
        ['Ctrl-k', 'win', ['mac']],
        ['Ctrl-k', 'linux', ['mac']],
        ['Ctrl-Shift-k', 'win', ['mac']],
        ['Ctrl-Shift-k', 'linux', ['mac']],
        ['Cmd-Alt-ArrowUp', 'mac', ['win', 'linux']],
        ['Cmd-Alt-ArrowDown', 'mac', ['win', 'linux']],
    ] as const)('disables the %s hotkey only on %s', (key, platform, forbiddenPlatforms) => {
        const bindings = createState().facet(keymap).flat();
        const binding = bindings.find((candidate) => candidate[platform] === key);

        expect(binding).toBeDefined();
        // The entry must not fire on the other platforms, so neither a generic
        // `key` nor any of their platform fields may be set.
        expect(binding!.key).toBeUndefined();
        forbiddenPlatforms.forEach((forbiddenPlatform) => {
            expect(binding![forbiddenPlatform]).toBeUndefined();
        });
        expect(binding!.run!({} as unknown as EditorView)).toBe(true);
    });
});
