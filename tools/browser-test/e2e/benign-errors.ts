/**
 * Copyright (c) 2015-2026 Adguard Software Ltd.
 *
 * @file Centralized benign error patterns for Firefox E2E background error filtering.
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
 * Regex patterns matching known-benign transient error messages.
 * These typically occur due to network unavailability in CI Docker environments.
 */
export const BENIGN_ERROR_PATTERNS: RegExp[] = [
    // Network fetch failures
    /NetworkError/i,
    /TypeError: NetworkError when attempting to fetch resource/,
    /net::ERR_/,

    // Firefox NS_ERROR codes for network/abort
    /NS_ERROR_NET_/,
    /NS_ERROR_ABORT/,
    /NS_ERROR_UNEXPECTED/,

    // DNS and connection failures
    /DNS resolution failed/i,
    /Connection refused/i,
    /ECONNREFUSED/,
];

/**
 * Filters out benign errors from the given error list.
 * Errors with source 'firefox-bidi-setup' are never filtered — they indicate
 * broken monitoring infrastructure and must always cause test failure.
 *
 * @param errors Collected E2E errors.
 * @param patterns Regex patterns for benign error messages.
 *
 * @returns Non-benign errors only.
 */
export const filterBenignErrors = (
    errors: E2EError[],
    patterns: RegExp[],
): E2EError[] => {
    return errors.filter((error) => {
        if (error.source === 'firefox-bidi-setup') {
            return true;
        }
        return !patterns.some((pattern) => pattern.test(error.message));
    });
};
