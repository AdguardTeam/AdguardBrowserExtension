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

import { vi } from 'vitest';
import browser from 'webextension-polyfill';

import { UserAgent } from '../../../Extension/src/common/user-agent';
import {
    ExtensionStoreResolver,
} from '../../../Extension/src/background/services/extension-store/extension-store-resolver';

/** Browser flags used by extension store tests. */
type StoreBrowserFlags = Pick<typeof UserAgent, 'isEdge' | 'isOpera' | 'isFirefox' | 'isYandex' | 'isChromium'>;

/**
 * Sets browser flags for a store test.
 *
 * @param flags Flags to replace.
 */
function setBrowserFlags(flags: Partial<StoreBrowserFlags>): void {
    Object.entries(flags).forEach(([key, value]) => {
        Object.defineProperty(UserAgent, key, { value, configurable: true });
    });
}

/**
 * Mocks store metadata and runtime browser flags, returning their cleanup function.
 *
 * @param flags Browser flags to override after clearing Edge, Opera, and Firefox.
 *
 * @returns Function restoring the original flags and management API.
 */
export function mockExtensionStoreEnvironment(flags: Partial<StoreBrowserFlags> = {}): () => void {
    Object.defineProperty(ExtensionStoreResolver, 'cachedStore', { value: undefined, writable: true });
    const originalFlags: StoreBrowserFlags = {
        isEdge: UserAgent.isEdge,
        isOpera: UserAgent.isOpera,
        isFirefox: UserAgent.isFirefox,
        isYandex: UserAgent.isYandex,
        isChromium: UserAgent.isChromium,
    };
    const originalManagement = browser.management;

    setBrowserFlags({
        isEdge: false, isOpera: false, isFirefox: false, ...flags,
    });
    Object.assign(browser, {
        management: {
            ...originalManagement,
            getSelf: vi.fn<typeof browser.management.getSelf>(),
        },
    });

    return () => {
        Object.defineProperty(ExtensionStoreResolver, 'cachedStore', { value: undefined, writable: true });
        setBrowserFlags(originalFlags);
        Object.assign(browser, { management: originalManagement });
    };
}
