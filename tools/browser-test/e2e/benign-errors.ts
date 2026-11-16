/**
 * Copyright (c) 2015-2026 Adguard Software Ltd.
 *
 * @file Centralized benign error patterns for E2E error filtering.
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

import { type E2EError } from './types';

/**
 * Error source prefix for errors collected from Firefox.
 */
const FIREFOX_SOURCE_PREFIX = 'firefox-';

/**
 * Error source prefix for errors collected from Chromium.
 */
const CHROMIUM_SOURCE_PREFIX = 'chromium-';

/**
 * Error source prefixes of the Chromium background surfaces.
 */
const CHROMIUM_BACKGROUND_SOURCE_PREFIXES = [
    `${CHROMIUM_SOURCE_PREFIX}background`,
];

/**
 * Error source prefixes of the Firefox background surfaces.
 */
const FIREFOX_BACKGROUND_SOURCE_PREFIXES = [
    'firefox-console',
    'firefox-exception',
];

/**
 * Error source prefixes of the background surfaces. The CI network failures
 * these patterns exist for are emitted by the background engine, not by the
 * extension pages.
 */
const BACKGROUND_SOURCE_PREFIXES = [
    ...CHROMIUM_BACKGROUND_SOURCE_PREFIXES,
    ...FIREFOX_BACKGROUND_SOURCE_PREFIXES,
];

/**
 * Error source prefixes of the extension pages, where the browser emits layout
 * warnings.
 */
const PAGE_SOURCE_PREFIXES = [
    `${CHROMIUM_SOURCE_PREFIX}page`,
    `${FIREFOX_SOURCE_PREFIX}page`,
];

/**
 * A known-benign transient error message pattern, optionally scoped to the
 * error sources it was observed in.
 */
export type BenignErrorPattern = {
    /**
     * Regex matching the benign error message.
     */
    pattern: RegExp;

    /**
     * Error source prefixes the pattern applies to (e.g. `firefox-`).
     * When omitted, the pattern applies to every source.
     */
    sourcePrefixes?: string[];
};

/**
 * Patterns matching known-benign transient error messages.
 * These typically occur due to network unavailability in CI Docker environments.
 * Engine-specific patterns are scoped to their engine's background sources, so
 * they cannot mask regressions in the other engine's errors.
 */
export const BENIGN_ERROR_PATTERNS: BenignErrorPattern[] = [
    // Firefox network fetch failures; Chromium reports `net::ERR_` instead.
    { pattern: /NetworkError/i, sourcePrefixes: FIREFOX_BACKGROUND_SOURCE_PREFIXES },
    {
        pattern: /TypeError: NetworkError when attempting to fetch resource/,
        sourcePrefixes: FIREFOX_BACKGROUND_SOURCE_PREFIXES,
    },

    // Chromium network fetch failures.
    { pattern: /net::ERR_/, sourcePrefixes: CHROMIUM_BACKGROUND_SOURCE_PREFIXES },

    // Firefox NS_ERROR codes for network/abort
    { pattern: /NS_ERROR_NET_/, sourcePrefixes: FIREFOX_BACKGROUND_SOURCE_PREFIXES },
    { pattern: /NS_ERROR_ABORT/, sourcePrefixes: FIREFOX_BACKGROUND_SOURCE_PREFIXES },
    { pattern: /NS_ERROR_UNEXPECTED/, sourcePrefixes: FIREFOX_BACKGROUND_SOURCE_PREFIXES },

    // DNS and connection failures
    { pattern: /DNS resolution failed/i, sourcePrefixes: BACKGROUND_SOURCE_PREFIXES },
    { pattern: /Connection refused/i, sourcePrefixes: BACKGROUND_SOURCE_PREFIXES },
    { pattern: /ECONNREFUSED/, sourcePrefixes: BACKGROUND_SOURCE_PREFIXES },

    // Firefox throws this when intercepting requests on about:blank pages
    { pattern: /Invalid request url: about:blank/, sourcePrefixes: [FIREFOX_SOURCE_PREFIX] },

    // Browser layout warning emitted by ResizeObserver during reflow; benign.
    // Scoped to the extension pages where it was observed: background errors
    // (and other surfaces) are still checked, so a real layout or engine
    // regression elsewhere is not filtered out.
    {
        pattern: /ResizeObserver loop (limit exceeded|completed with undelivered notifications)/,
        sourcePrefixes: PAGE_SOURCE_PREFIXES,
    },
];

/**
 * Checks whether an error matches a benign pattern applicable to its source.
 *
 * @param error Collected E2E error.
 * @param patterns Benign error patterns.
 *
 * @returns True when the error is known-benign.
 */
const isBenignError = (error: E2EError, patterns: BenignErrorPattern[]): boolean => {
    return patterns.some(({ pattern, sourcePrefixes }) => {
        if (!pattern.test(error.message)) {
            return false;
        }

        return !sourcePrefixes
            || sourcePrefixes.some((prefix) => error.source.startsWith(prefix));
    });
};

/**
 * Splits errors into known-benign and unexpected ones.
 * Errors with source 'firefox-bidi-setup' are never treated as benign — they
 * indicate broken monitoring infrastructure and must always cause test failure.
 *
 * @param errors Collected E2E errors.
 * @param patterns Benign error patterns.
 *
 * @returns Known-benign errors and unexpected errors.
 */
export const partitionBenignErrors = (
    errors: E2EError[],
    patterns: BenignErrorPattern[],
): { benign: E2EError[]; unexpected: E2EError[] } => {
    const benign: E2EError[] = [];
    const unexpected: E2EError[] = [];

    errors.forEach((error) => {
        if (error.source !== 'firefox-bidi-setup' && isBenignError(error, patterns)) {
            benign.push(error);
            return;
        }

        unexpected.push(error);
    });

    return { benign, unexpected };
};
