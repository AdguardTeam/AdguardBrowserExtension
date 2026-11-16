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

import browser from 'webextension-polyfill';

import { getErrorMessage } from '@adguard/logger';

import { logger } from '../../../common/logger';
import { UserAgent } from '../../../common/user-agent';

/**
 * Extension store identifiers used by the AdGuard Backend API.
 */
export enum ExtensionStore {
    Chrome = 'chrome',
    Edge = 'edge',
    Opera = 'opera',
    Firefox = 'firefox',
}

/**
 * Resolves the store associated with the installed extension package.
 */
export class ExtensionStoreResolver {
    /**
     * Store homepage URL prefixes returned in the extension metadata by the
     * {@link browser.management.getSelf} API.
     */
    private static readonly STORE_HOMEPAGE_URL_PREFIXES: ReadonlyArray<readonly [ExtensionStore, string]> = [
        // Chrome Web Store metadata can use either the current domain or the legacy URL.
        [ExtensionStore.Chrome, 'https://chromewebstore.google.com/'],
        [ExtensionStore.Chrome, 'https://chrome.google.com/webstore/'],
        [ExtensionStore.Edge, 'https://microsoftedge.microsoft.com/'],
        [ExtensionStore.Opera, 'https://addons.opera.com/'],
        [ExtensionStore.Firefox, 'https://addons.mozilla.org/'],
    ];

    /**
     * Known store update endpoints, matched by origin and path without query parameters.
     */
    private static readonly STORE_UPDATE_URLS: ReadonlyArray<readonly [ExtensionStore, string]> = [
        [ExtensionStore.Chrome, 'https://clients2.google.com/service/update2/crx'],
        [ExtensionStore.Edge, 'https://edge.microsoft.com/extensionwebstorebase/v1/crx'],
        [ExtensionStore.Opera, 'https://extension-updates.opera.com/api/omaha/update'],
    ];

    /**
     * Store resolved by a successful metadata lookup in this background context.
     */
    private static cachedStore: ExtensionStore | undefined;

    /**
     * Resolves the store the current extension package was installed from.
     *
     * The store is determined from the homepage URL reported by the
     * {@link browser.management.getSelf} API, then from a known store update URL.
     * When neither URL identifies a store or the metadata is unavailable, the store
     * is derived from the runtime browser user agent.
     * Successful lookups are cached; failed lookups can be retried on the next call.
     * Firefox always uses Firefox Add-ons and does not require a metadata lookup.
     *
     * @returns Resolved extension store.
     */
    public static async resolve(): Promise<ExtensionStore> {
        // Firefox cannot install Chromium store packages, so its store cannot differ from the runtime browser.
        // Skip the metadata lookup that is needed to distinguish Chrome, Edge, and Opera packages.
        if (UserAgent.isFirefox) {
            return ExtensionStore.Firefox;
        }

        if (ExtensionStoreResolver.cachedStore) {
            return ExtensionStoreResolver.cachedStore;
        }

        try {
            const { homepageUrl, updateUrl } = await browser.management.getSelf();
            // Opera reports an empty homepageUrl for Chrome Web Store packages, but keeps their updateUrl.
            // Check the update endpoint before falling back to the browser, which may differ from the package's store.
            const store = ExtensionStoreResolver.getStoreByHomepageUrl(homepageUrl)
                ?? ExtensionStoreResolver.getStoreByUpdateUrl(updateUrl);
            if (!store) {
                logger.debug(`[ext.ExtensionStoreResolver.resolve]: Unknown store URLs: homepage=${homepageUrl ?? 'none'}, update=${updateUrl ?? 'none'}`);
            }

            ExtensionStoreResolver.cachedStore = store ?? ExtensionStoreResolver.getStoreByUserAgent();
            return ExtensionStoreResolver.cachedStore;
        } catch (error) {
            const message = getErrorMessage(error);
            logger.warn(`[ext.ExtensionStoreResolver.resolve]: Failed to get extension info: ${message}`);
        }

        return ExtensionStoreResolver.getStoreByUserAgent();
    }

    /**
     * Matches a homepage URL against the known store prefixes.
     *
     * @param homepageUrl Homepage URL from the extension metadata.
     *
     * @returns Matched store or null when no prefix matches.
     */
    private static getStoreByHomepageUrl(homepageUrl?: string): ExtensionStore | null {
        if (!homepageUrl) {
            return null;
        }

        const prefix = ExtensionStoreResolver.STORE_HOMEPAGE_URL_PREFIXES.find(
            ([, urlPrefix]) => homepageUrl.startsWith(urlPrefix),
        );
        return prefix?.[0] ?? null;
    }

    /**
     * Matches an update URL against known store endpoints.
     *
     * @param updateUrl Update URL from the extension metadata.
     *
     * @returns Matched store or null for missing, malformed, or unknown URLs.
     */
    private static getStoreByUpdateUrl(updateUrl?: string): ExtensionStore | null {
        if (!updateUrl) {
            return null;
        }

        try {
            const url = new URL(updateUrl);
            // URL normalizes the origin's case; paths remain case-sensitive.
            const endpoint = `${url.origin}${url.pathname.replace(/\/$/, '')}`;
            return ExtensionStoreResolver.STORE_UPDATE_URLS.find(([, storeUrl]) => endpoint === storeUrl)?.[0] ?? null;
        } catch {
            return null;
        }
    }

    /**
     * Derives the store from the runtime browser user agent.
     *
     * @returns Store matching the runtime browser.
     */
    private static getStoreByUserAgent(): ExtensionStore {
        if (UserAgent.isEdge) {
            return ExtensionStore.Edge;
        }
        if (UserAgent.isOpera) {
            return ExtensionStore.Opera;
        }
        if (UserAgent.isFirefox) {
            return ExtensionStore.Firefox;
        }
        return ExtensionStore.Chrome;
    }
}
