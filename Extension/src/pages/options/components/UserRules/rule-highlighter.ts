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

import { useEffect, useState } from 'react';

import {
    getHtmlRenderer,
    mountHighlightStyle,
    type SearchHighlightOptions,
} from '@adguard/rules-editor';

import { logger } from '../../../../common/logger';
import { adguardHighlightStyle } from '../../../common/components/Editor/adguard-theme';

/**
 * Synchronous renderer mapping a single rule line to colorized, escaped HTML.
 *
 * Optionally accepts {@link SearchHighlightOptions} to wrap occurrences of a
 * search term in a span (handled by the renderer itself, so matches that span
 * several syntax tokens are highlighted correctly).
 */
export type RuleHtmlRenderer = (rule: string, search?: SearchHighlightOptions) => string;

/**
 * Initialization state of the shared rule highlighter.
 */
export enum HighlighterStatus {
    /**
     * The renderer is still being initialized (WASM/grammar loading).
     */
    Loading = 'loading',

    /**
     * The renderer is ready and rows are syntax-highlighted.
     */
    Ready = 'ready',

    /**
     * Initialization failed permanently (e.g. WASM blocked by CSP or missing).
     * Rows fall back to plain text; the consumer must stop showing a loading
     * state.
     */
    Error = 'error',
}

/**
 * Result of {@link useRuleHighlighter}: the renderer (once ready) plus a
 * tri-state {@link HighlighterStatus} so consumers can distinguish "still
 * loading" from "permanently failed".
 */
export interface RuleHighlighterState {
    /**
     * The renderer once ready, otherwise `null`.
     */
    renderer: RuleHtmlRenderer | null;

    /**
     * Current initialization status.
     */
    status: HighlighterStatus;
}

/**
 * Module-level singleton promise. Ensures the WASM grammar/renderer is
 * initialized once and shared across all rows and list remounts.
 */
let rendererPromise: Promise<RuleHtmlRenderer> | null = null;

/**
 * Lazily initializes (once) and returns the shared rule HTML renderer.
 *
 * Uses the same Oniguruma WASM asset URL as the editor, so no second copy is
 * bundled, and the editor's `adguardHighlightStyle` so colors match. Mounts the
 * highlight style's CSS so emitted token classes are colorized without an editor.
 *
 * @returns A promise resolving to the synchronous rule renderer.
 */
export const getRuleHighlighter = (): Promise<RuleHtmlRenderer> => {
    if (rendererPromise === null) {
        rendererPromise = (async (): Promise<RuleHtmlRenderer> => {
            const wasm = new URL('vscode-oniguruma/release/onig.wasm', import.meta.url);
            const renderer = await getHtmlRenderer(wasm, { highlightStyle: adguardHighlightStyle });
            mountHighlightStyle(adguardHighlightStyle);
            return renderer;
        })().catch((error) => {
            // Clear the cached promise so a later mount can retry initialization
            // instead of being permanently stuck after a transient failure.
            rendererPromise = null;
            throw error;
        });
    }
    return rendererPromise;
};

/**
 * React hook exposing the shared rule renderer together with its initialization
 * {@link HighlighterStatus}.
 *
 * The tri-state status lets consumers distinguish "still loading" from
 * "permanently failed": on failure the renderer stays `null` (rows keep plain
 * text), the error is logged, and the status becomes {@link HighlighterStatus.Error}
 * so any loading indicator can be hidden instead of showing forever.
 *
 * @returns The current {@link RuleHighlighterState}.
 */
export const useRuleHighlighter = (): RuleHighlighterState => {
    const [state, setState] = useState<RuleHighlighterState>({
        renderer: null,
        status: HighlighterStatus.Loading,
    });

    useEffect(() => {
        let active = true;

        getRuleHighlighter()
            .then((ruleRenderer) => {
                if (active) {
                    setState({ renderer: ruleRenderer, status: HighlighterStatus.Ready });
                }
            })
            .catch((error) => {
                logger.error('[ext.rule-highlighter]: failed to initialize highlighter:', error);
                if (active) {
                    setState({ renderer: null, status: HighlighterStatus.Error });
                }
            });

        return () => {
            active = false;
        };
    }, []);

    return state;
};
