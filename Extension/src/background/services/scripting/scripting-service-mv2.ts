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

import browser, { type ExtensionTypes } from 'webextension-polyfill';

import { logger } from '../../../common/logger';

import { type ExecuteScriptOptionsCommon } from './types';

/**
 * ExecuteScriptOptionsCommon with MV2 specific fields.
 */
type ExecuteScriptOptions = ExecuteScriptOptionsCommon & {
    /**
     * The time at which the script should be executed.
     */
    runAt?: ExtensionTypes.RunAt;

    /**
     * Code to inject.
     */
    code?: string;
};

/**
 * Executes a script in the context of a given tab.
 *
 * @param tabId The tab ID.
 * @param options The options for the script execution.
 *
 * @throws Basic {@link Error} if passed options contains invalid or unsupported fields.
 */
export const executeScript = async (
    tabId: number | undefined,
    options: ExecuteScriptOptions,
): Promise<void> => {
    if (!tabId) {
        logger.debug('[ext.scripting-service-mv2]: tab id is not provided');
        return;
    }

    const {
        frameId,
        allFrames,
        runAt,
        files = [],
        code,
    } = options;

    const hasFiles = files.length !== 0;
    const hasCode = code !== undefined;

    // Ensure that at least one and not both of the 'files' or 'code' is provided
    if (hasFiles === hasCode) {
        throw new Error('Provide either "files" or "code", but not both.');
    }

    const executeScriptOptions: ExtensionTypes.InjectDetails = {
        frameId,
        allFrames,
        runAt,
    };

    let tasks: Promise<unknown[]>[] = [];
    if (hasFiles) {
        tasks = files.map((file) => browser.tabs.executeScript(tabId, {
            ...executeScriptOptions,
            file,
        }));
    } else if (hasCode) {
        tasks = [
            browser.tabs.executeScript(tabId, {
                ...executeScriptOptions,
                code,
            }),
        ];
    }

    const promises = await Promise.allSettled(tasks);

    // Handles errors
    promises.forEach((promise) => {
        if (promise.status === 'rejected') {
            logger.error(`[ext.scripting-service-mv2]: cannot inject script to frame ${frameId} and tab ${tabId} due to:`, promise.reason);
        }
    });
};
