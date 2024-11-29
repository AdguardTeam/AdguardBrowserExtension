/**
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

import { getHostname } from 'tldts';
import browser, { type Tabs } from 'webextension-polyfill';

import { isHttpRequest } from 'tswebextension';

import { executeScript } from 'scripting-service';

import { getErrorMessage } from '../common/error';
import { UserAgent } from '../common/user-agent';
import { logger } from '../common/logger';
import {
    CONTENT_SCRIPT_START_OUTPUT,
    CONTENT_SCRIPT_END_OUTPUT,
    SUBSCRIBE_OUTPUT,
} from '../../../constants';
import { TabsApi } from '../common/api/extension/tabs';

import { createPromiseWithTimeout } from './utils/timeouts';

/**
 * Helper class for injecting content script into tabs, opened before extension initialization.
 */
export class ContentScriptInjector {
    /**
     * Key used to store the injected flag in session storage.
     */
    private static INJECTED_KEY = 'content_script_injected';

    private static INJECTION_LIMIT_MS = 1000;

    /**
     * Content-scripts src relative paths.
     */
    private static contentScripts = [
        ContentScriptInjector.createContentScriptUrl(CONTENT_SCRIPT_START_OUTPUT),
        ContentScriptInjector.createContentScriptUrl(CONTENT_SCRIPT_END_OUTPUT),
        ContentScriptInjector.createContentScriptUrl(SUBSCRIBE_OUTPUT),
    ];

    /**
     * Content scripts are blocked from executing on some websites by browsers
     * to protect users from extension escalating privileges.
     */
    private static jsInjectRestrictedHostnames = {
        chromium: [
            'chrome.google.com',
            // https://chromium.googlesource.com/chromium/src/+/5d1f214db0f7996f3c17cd87093d439ce4c7f8f1/chrome/common/extensions/chrome_extensions_client.cc#232
            'chromewebstore.google.com',
        ],
        firefox: [
            'accounts-static.cdn.mozilla.net',
            'accounts.firefox.com',
            'addons.cdn.mozilla.net',
            'addons.mozilla.org',
            'api.accounts.firefox.com',
            'content.cdn.mozilla.net',
            'discovery.addons.mozilla.org',
            'install.mozilla.org',
            'oauth.accounts.firefox.com',
            'profile.accounts.firefox.com',
            'support.mozilla.org',
            'sync.services.mozilla.com',
        ],
        opera: [
            'addons.opera.com',
        ],
        edge: [
            'microsoftedge.microsoft.com',
        ],
    };

    /**
     * Returns open tabs and injects content scripts into tab contexts.
     */
    public static async init(): Promise<void> {
        const tabs = await TabsApi.getAll();

        const tasks: Promise<void>[] = [];

        tabs.forEach((tab) => {
            // Do not inject scripts into extension pages, browser internals and tabs without id
            if (typeof tab.id !== 'number'
                || !ContentScriptInjector.canInjectJs(tab)) {
                return;
            }

            const { id } = tab;

            ContentScriptInjector.contentScripts.forEach((src) => {
                tasks.push(ContentScriptInjector.inject(id, src));
            });
        });

        // Loading order is not matter,
        // because all content-scripts are independent and tabs have been already loaded
        const promises = await Promise.allSettled(tasks);

        // Handles errors
        promises.forEach((promise) => {
            if (promise.status === 'rejected') {
                logger.error('Cannot inject script to tab due to: ', promise.reason);
            }
        });
    }

    /**
     * Inject content-script into specified tab.
     *
     * @param tabId The ID of the tab to inject the content script into.
     * @param src Path to content-script src.
     * @throws Error if the content script injection times out or fails for another reason.
     */
    private static async inject(
        tabId: number,
        src: string,
    ): Promise<void> {
        try {
            /**
             * This implementation uses Promise.race() to prevent content script injection
             * from freezing the application when Chrome drops tabs.
             */
            await createPromiseWithTimeout(
                executeScript(tabId, {
                    allFrames: true,
                    file: src,
                }),
                ContentScriptInjector.INJECTION_LIMIT_MS,
                `Content script inject timeout because tab with id ${tabId} does not respond`,
            );
        } catch (error: unknown) {
            // re-throw error with custom message
            throw new Error(`Cannot inject ${src} to tab with id ${tabId}. Error: ${getErrorMessage(error)}`);
        }
    }

    /**
     * Creates content-script relative url.
     *
     * @param output Content script output path.
     * @returns Content-script relative url.
     */
    private static createContentScriptUrl(output: string): string {
        return `/${output}.js`;
    }

    /**
     * Checks, if content script can be injected to specified tab.
     *
     * @param tab Tab browser details.
     *
     * @returns True, if content script can be injected, else returns false.
     */
    private static canInjectJs(tab: Tabs.Tab): boolean {
        if (typeof tab.url !== 'string'
                || !isHttpRequest(tab.url)
                // Tabs with both 'unloaded' and 'loading' statuses can be frozen and thus should be skipped
                || tab.status !== 'complete'
                || tab.discarded) {
            return false;
        }

        const hostname = getHostname(tab.url);

        if (!hostname) {
            return false;
        }

        const { jsInjectRestrictedHostnames } = ContentScriptInjector;

        if (UserAgent.isChromium
            && jsInjectRestrictedHostnames.chromium.includes(hostname)) {
            return false;
        }

        if (UserAgent.isFirefox
           && jsInjectRestrictedHostnames.firefox.includes(hostname)) {
            return false;
        }

        if (UserAgent.isOpera
           && jsInjectRestrictedHostnames.opera.includes(hostname)) {
            return false;
        }

        if (UserAgent.isEdge
            && jsInjectRestrictedHostnames.edge.includes(hostname)) {
            return false;
        }

        return true;
    }

    /**
     * Sets the injected flag in session storage.
     * This method updates the session storage to indicate that content scripts have been injected.
     */
    public static async setInjected(): Promise<void> {
        try {
            await browser.storage.session.set({ [ContentScriptInjector.INJECTED_KEY]: true });
        } catch (e) {
            logger.error('Cannot set injected flag in session storage', e);
        }
    }

    /**
     * Checks if content scripts have been injected.
     * Uses session storage since it is faster than sending a message to the content script.
     * As of November 25, 2025, Firefox v132.0.2 takes 1 second to send a message,
     * whereas reading from the session storage takes only 1 ms.
     *
     * @returns True if content scripts were injected; otherwise, false.
     */
    public static async isInjected(): Promise<boolean> {
        let isInjected = false;
        try {
            const result = await browser.storage.session.get(ContentScriptInjector.INJECTED_KEY);
            isInjected = result[ContentScriptInjector.INJECTED_KEY] === true;
        } catch (e) {
            logger.error('Cannot get injected flag from session storage', e);
        }

        return isInjected;
    }
}
