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

/**
 * Stealth settings to import.
 * All fields are optional — only URL-provided values are applied.
 */
export type StealthImportConfig = {
    enabled: boolean | undefined;
    hideSearchQueries: boolean | undefined;
    sendDnt: boolean | undefined;
    blockWebrtc: boolean | undefined;
    stripUrl: boolean | undefined;
    blockTrackers: boolean | undefined;
    thirdPartyCookiesMin: number | undefined;
    firstPartyCookiesMin: number | undefined;
    xClient: boolean | undefined;
    hideReferrer: boolean | undefined;
};

/**
 * Parsed and validated import configuration derived from a configuration URL.
 */
export type ImportConfiguration = {
    // v3 is kept for backward compatibility with existing import links.
    schemeVersion: 3 | 4;
    regularFilters: number[];
    customFilters: Array<{ title: string; url: string }>;
    stealth: Partial<StealthImportConfig>;
    browsingSecurity?: { enabled: boolean };
    informational: Record<string, string>;
};
