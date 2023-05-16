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
import browser from 'webextension-polyfill';

import { isHttpRequest } from '@adguard/tswebextension';

import { Log } from '../common/log';
import {
    CONTENT_SCRIPT_START_OUTPUT,
    CONTENT_SCRIPT_END_OUTPUT,
    SUBSCRIBE_OUTPUT,
} from '../../../constants';

import { TabsApi } from './api/extension/tabs';

/**
 * Helper class for injecting content script into tabs, opened before extension initialization.
 */
export class ContentScriptInjector {
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
     * Returns open tabs and injects content scripts into tab contexts.
     */
    public static async init(): Promise<void> {
        const tabs = await TabsApi.getAll();

        const tasks: Promise<void>[] = [];

        tabs.forEach((tab) => {
            // Do not inject scripts into extension pages, browser internals and tabs without id
            // Tabs with both 'unloaded' and 'loading' statuses can be freezed and thus should be skipped
            if (typeof tab.id !== 'number'
                || typeof tab.url !== 'string'
                || !isHttpRequest(tab.url)
                || tab.status !== 'complete'
                || tab.discarded
            ) {
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
                Log.error('Cannot inject script to tab due to: ', promise.reason);
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
            await Promise.race([
                browser.tabs.executeScript(tabId, {
                    allFrames: true,
                    file: src,
                }),
                new Promise((resolve, reject) => {
                    setTimeout(() => {
                        reject(new Error(`Content script inject timeout: tab #${tabId} doesn't respond.`));
                    }, ContentScriptInjector.INJECTION_LIMIT_MS);
                }),
            ]);
        } catch (error: unknown) {
            // re-throw error with custom message
            const message = error instanceof Error ? error.message : String(error);
            throw new Error(`Cannot inject ${src} to tab ${tabId}. Error: ${message}`);
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
}
