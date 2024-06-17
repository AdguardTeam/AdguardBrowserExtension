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

type ExecuteScriptOptions = {
    file?: string,
    frameId?: number,
    allFrames?: boolean,
    runAt?: string,
    code?: string,
};

export const executeScript = async (
    tabId: number | undefined,
    options: ExecuteScriptOptions,
): Promise<chrome.scripting.InjectionResult<unknown>[]> => {
    if (!tabId) {
        logger.debug('Tab id is not provided');
        return [];
    }

    const { file } = options;

    if (!file) {
        logger.debug('File is not provided');
        return [];
    }

    const executeScriptOptions = {
        target: { tabId },
        files: [file],
    };

    return new Promise((resolve, reject) => {
        chrome.scripting.executeScript(executeScriptOptions, (result) => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
            }
            resolve(result);
        });
    });
};
