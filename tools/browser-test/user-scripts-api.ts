/**
 * Copyright (c) 2015-2025 Adguard Software Ltd.
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
    type Worker,
    type Page,
    type ConsoleMessage,
} from 'playwright';

import { logError, logSuccess } from './logger';
import { TESTCASES_BASE_URL } from './test-constants';

/**
 * Just an empirical timeout to wait for console message.
 * Increase if you see random test failures.
 */
const TIMEOUT_MS = 3000;

/**
 * Tests if userScripts API is available and working by executing a simple script
 * and checking if the console message appears.
 *
 * @param backgroundPage The service worker where userScripts API will be called.
 * @param page The page where we'll check for console messages.
 * @param debugMode If true, enables extended timeouts.
 *
 * @returns A promise that resolves to true if userScripts API works, false otherwise.
 */
export const testUserScriptsAvailability = async (
    backgroundPage: Worker,
    page: Page,
    debugMode: boolean,
): Promise<boolean> => {
    try {
        // Open a simple test page since userScripts.execute can not be done
        // on the default start about:blank page.
        await page.goto(TESTCASES_BASE_URL);

        const testMessage = 'User script works!';
        let consoleMessageReceived = false;

        /**
         * Listener for console messages to detect if userScript executed.
         *
         * @param msg Console message from the page.
         */
        const consoleListener = (msg: ConsoleMessage): void => {
            if (msg.text() === testMessage) {
                consoleMessageReceived = true;
            }
        };

        page.on('console', consoleListener);

        // Execute userScript from service worker
        const scriptExecutedErr = await backgroundPage.evaluate(async (message: string): Promise<null | Error> => {
            // Get the active tab
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tabs.length === 0) {
                return new Error('Cannot find active tab    ');
            }

            const tab = tabs[0];
            if (!tab || !tab.id) {
                return new Error('Cannot find active tab id');
            }

            const tabId = tab.id;
            const frameId = 0; // Main frame

            try {
                // @ts-ignore - userScripts.execute might not be in types yet
                await chrome.userScripts.execute({
                    target: { frameIds: [frameId], tabId },
                    injectImmediately: true,
                    js: [{ code: `console.log('${message}')` }],
                    world: 'MAIN',
                });
                return null;
            } catch (error) {
                return error as Error;
            }
        }, testMessage);

        if (scriptExecutedErr) {
            page.off('console', consoleListener);
            logError('UserScript execution failed', scriptExecutedErr);
            return false;
        }

        // Wait a bit for the console message to appear
        await page.waitForTimeout(debugMode ? TIMEOUT_MS * 10 : TIMEOUT_MS);

        // Clean up listener
        page.off('console', consoleListener);

        return consoleMessageReceived;
    } catch (error) {
        logError('UserScripts availability test failed', error);
        return false;
    }
};

/**
 * Enables userScripts permission for the extension through Chrome's extension settings page.
 *
 * @param page The page where extension settings will be opened.
 * @param extensionId The ID of the extension to configure.
 *
 * @returns A promise that resolves to true if permission was enabled successfully, false otherwise.
 */
export const enableUserScriptsPermission = async (
    page: Page,
    extensionId: string,
): Promise<boolean> => {
    try {
        // Navigate to the extension's details page
        const extensionDetailsUrl = `chrome://extensions/?id=${extensionId}`;
        await page.goto(extensionDetailsUrl);

        // Wait for the page to load
        await page.waitForLoadState('networkidle');
    } catch (e) {
        logError('Failed to navigate to extension details page', e);
        return false;
    }

    // Try to find and click the userScripts toggle
    try {
        await page.evaluate(() => {
            const extensionsManager = document.querySelector('extensions-manager');
            if (!extensionsManager?.shadowRoot) {
                throw new Error('Extensions manager not found');
            }

            const viewManager = extensionsManager.shadowRoot.querySelector('#viewManager');
            if (!viewManager) {
                throw new Error('View manager not found');
            }

            const detailView = viewManager.querySelector('extensions-detail-view');
            if (!detailView?.shadowRoot) {
                throw new Error('Detail view not found');
            }

            const allowUserScripts = detailView.shadowRoot.querySelector('#allow-user-scripts');
            if (!allowUserScripts?.shadowRoot) {
                throw new Error('Allow user scripts element not found');
            }

            const crToggle = allowUserScripts.shadowRoot.querySelector('#crToggle') as HTMLElement;
            if (!crToggle) {
                throw new Error('CR toggle not found');
            }

            crToggle.click();
        });

        logSuccess('UserScripts permission enabled successfully');
        return true;
    } catch (error) {
        logError('Failed to enable userScripts permission', error);
        return false;
    }
};
