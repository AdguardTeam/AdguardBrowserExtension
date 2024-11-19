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

import { logger } from '../../../common/logger';

/**
 * Options for executing a script.
 */
type ExecuteScriptOptions = {
    /**
     * The frame ID.
     */
    frameId?: number;

    /**
     * Whether the script should be executed in all frames.
     */
    allFrames?: boolean;

    /**
     * The time at which the script should be executed.
     */
    runAt?: string;

    /**
     * The file to execute.
     */
    file?: string;

    /**
     * The function to execute.
     */
    func?: () => void;
};

/**
 * Executes a script in the context of a given tab.
 * @param tabId The tab ID.
 * @param options The options for the script execution.
 * @returns The result of the script execution.
 */
export const executeScript = async (
    tabId: number | undefined,
    options: ExecuteScriptOptions,
): Promise<chrome.scripting.InjectionResult<unknown>[]> => {
    if (!tabId) {
        logger.debug('Tab id is not provided');
        return [];
    }

    const {
        file,
        func,
    } = options;

    // Ensure that at least one of 'file' or 'func' is provided
    if (!file && !func) {
        throw new Error('Neither file nor func are provided');
    }

    // Check for mutually exclusive options
    if (file && func) {
        throw new Error('Provide either "file" or "func", not both.');
    }

    let executeScriptOptions: chrome.scripting.ScriptInjection<unknown[], unknown>;

    if (file) {
        executeScriptOptions = {
            target: { tabId },
            files: [file],
        };
    } else if (func) {
        executeScriptOptions = {
            target: { tabId },
            func,
        };
    }

    return new Promise((resolve, reject) => {
        chrome.scripting.executeScript(executeScriptOptions, (result) => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
                return;
            }
            resolve(result);
        });
    });
};
