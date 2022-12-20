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

import UAParser from 'ua-parser-js';

/**
 * Helper class for user agent data
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/User-Agent_Client_Hints_API#browser_compatibility
 */
export class UserAgent {
    static parser = new UAParser(navigator.userAgent);

    /**
     * Gets current browser name
     *
     * @returns user agent browser name
     */
    static getBrowserName(): string | undefined {
        return this.parser.getBrowser().name;
    }

    /**
     * Check if current browser is as given
     *
     * @param browserName - Browser Name
     * @returns true, if current browser has specified name
     */
    static isTargetBrowser(browserName: string): boolean {
        return this.parser.getBrowser().name === browserName;
    }

    /**
     * Check if current platform is as given
     *
     * @param platformName - Platform name
     * @returns true, if current browser has specified name
     */
    static isTargetPlatform(platformName: string): boolean {
        return this.parser.getOS().name === platformName;
    }

    /**
     * Get browser version by name
     *
     * @param browserName - Browser Name
     * @returns browser version number or undefined
     */
    static getBrowserVersion(browserName: string): number | undefined {
        const browser = this.parser.getBrowser();

        return browser.name === browserName ? Number(browser.version) : undefined;
    }

    static isChrome = UserAgent.isTargetBrowser('Chrome');

    static isFirefox = UserAgent.isTargetBrowser('Firefox');

    static isOpera = UserAgent.isTargetBrowser('Opera');

    static isYandex = UserAgent.isTargetBrowser('Yandex');

    static isEdge = UserAgent.isTargetBrowser('Edge');

    static isEdgeChromium = Number(UserAgent.getBrowserVersion('Edge')) >= 79;

    static chromeVersion = UserAgent.getBrowserVersion('Chrome');

    static firefoxVersion = UserAgent.getBrowserVersion('Firefox');

    static operaVersion = UserAgent.getBrowserVersion('Opera');

    static isMacOs = UserAgent.isTargetPlatform('Mac OS');

    static isWindows = UserAgent.isTargetPlatform('Windows');

    static isAndroid = UserAgent.isTargetPlatform('Android');

    static isSupportedBrowser =
        (UserAgent.isChrome && Number(UserAgent.chromeVersion) >= 79)
        || (UserAgent.isFirefox && Number(UserAgent.firefoxVersion) >= 78)
        || (UserAgent.isOpera && Number(UserAgent.operaVersion) >= 66);

    static browserName = UserAgent.getBrowserName();
}
