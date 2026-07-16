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
 * Computes the SHA-256 hash of a string.
 *
 * @param text Text to hash.
 *
 * @returns SHA-256 hex string.
 */
export const hashString = async (text: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Computes the stable hash for a scriptlet invocation.
 *
 * @param name Scriptlet name.
 * @param args Scriptlet arguments array.
 *
 * @returns SHA-256 hex hash string.
 */
export const computeScriptletHash = async (name: string, args: string[]): Promise<string> => {
    return hashString(name + JSON.stringify(args));
};

/**
 * Computes the stable hash for a JS injection rule.
 *
 * @param body Generated JS rule body.
 *
 * @returns SHA-256 hex hash string.
 */
export const computeJsRuleHash = async (body: string): Promise<string> => {
    return hashString(body);
};
