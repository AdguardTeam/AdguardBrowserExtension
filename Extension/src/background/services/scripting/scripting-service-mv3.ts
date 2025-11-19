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

import { logger } from '../../../common/logger';

import { type ExecuteScriptOptionsCommon } from './types';

/**
 * ExecuteScriptOptionsCommon with MV3 specific fields.
 */
type ExecuteScriptOptionsMv3 = ExecuteScriptOptionsCommon & {
    /**
     * The function to execute.
     */
    func?: () => void;
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
    options: ExecuteScriptOptionsMv3,
): Promise<void> => {
    if (!tabId) {
        logger.debug('[ext.scripting-service-mv3]: tab id is not provided');
        return;
    }

    const {
        frameId,
        allFrames,
        files = [],
        func,
    } = options;

    const hasFiles = files.length !== 0;
    const hasFunc = func !== undefined;

    // Ensure that at least one and not both of the 'files' or 'func' is provided
    if (hasFiles === hasFunc) {
        throw new Error('Provide either "files" or "func", but not both.');
    }

    const frameIds = frameId !== undefined ? [frameId] : undefined;

    const target: chrome.scripting.InjectionTarget = {
        tabId,
        allFrames,
        frameIds,
    };

    let executeScriptOptions: chrome.scripting.ScriptInjection<unknown[], unknown>;
    if (hasFiles) {
        executeScriptOptions = {
            target,
            files,
        };
    } else if (hasFunc) {
        executeScriptOptions = {
            target,
            func,
        };
    }

    return new Promise((resolve, reject) => {
        chrome.scripting.executeScript(executeScriptOptions, () => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
                return;
            }
            resolve();
        });
    });
};
