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

import { USER_SCRIPTS_API_MIN_CHROME_VERSION_REQUIRED } from './constants';
import { logger } from './logger';
import { UserAgent } from './user-agent';

/**
 * Checks if User scripts API permission is granted.
 *
 * Note: do not rely on the engine value as its reload is required
 * for the value update which is not triggered when users grant or revoke the permission.
 *
 * @returns True if User scripts API permission is granted, false otherwise.
 */
export const isUserScriptsApiSupported = () => {
    try {
        // Method call which throws an error if User scripts API permission is not granted.
        chrome.userScripts.getScripts();
        return true;
    } catch {
        // User scripts API is not available.
        return false;
    }
};

/**
 * Checks if the User scripts API warning should be shown.
 *
 * @returns True if the User scripts API warning should be shown, false otherwise.
 */
export const shouldShowUserScriptsApiWarning = (): boolean => {
    if (isUserScriptsApiSupported()) {
        logger.debug('[ext.user-scripts-api]: User Scripts API permission is already granted');
        return false;
    }

    if (!__IS_MV3__) {
        logger.debug('[ext.user-scripts-api]: User Scripts API supported only in MV3');
        return false;
    }

    const currentChromeVersion = UserAgent.isChromium ? Number(UserAgent.version) : null;

    if (!currentChromeVersion) {
        logger.debug('[ext.user-scripts-api]: User Scripts API supported only in Chromium-based browsers');
        return false;
    }

    if (currentChromeVersion < USER_SCRIPTS_API_MIN_CHROME_VERSION_REQUIRED.DEV_MODE_TOGGLE) {
        logger.debug(`[ext.user-scripts-api]: User Scripts API is not supported in Chrome v${currentChromeVersion}`);
        return false;
    }

    return true;
};
