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

import UAParser from 'ua-parser-js';
import browser from 'webextension-polyfill';

import { MIN_SUPPORTED_VERSION } from '../../../constants';

/**
 * Helper class for user agent data.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/User-Agent_Client_Hints_API#browser_compatibility
 */
export class UserAgent {
    static WINDOWS_10_OS_VERSION = '10';

    static WINDOWS_11_OS_VERSION = '11';

    static PLATFORM_VERSION = 'platformVersion';

    static MIN_WINDOWS_11_PLATFORM_VERSION = 13;

    static ANDROID_OS_NAME = 'android';

    static parser = new UAParser(navigator.userAgent);

    /**
     * Returns current browser name.
     *
     * @returns user agent browser name.
     */
    static getBrowserName(): string | undefined {
        return UserAgent.isFirefoxMobile
            // Firefox mobile does not have own dedicated browser name
            ? 'Firefox Mobile'
            : UserAgent.parser.getBrowser().name;
    }

    /**
     * Returns current OS name.
     *
     * @returns OS name as string if possible to detect, undefined otherwise.
     */
    static getSystemName(): string | undefined {
        return UserAgent.parser.getOS().name;
    }

    /**
     * Returns current OS version.
     *
     * @returns OS version as string if possible to detect, undefined otherwise.
     */
    static getSystemVersion(): string | undefined {
        return UserAgent.parser.getOS().version;
    }

    /**
     * Returns current platform version.
     * Uses NavigatorUAData.getHighEntropyValues() to get platform version.
     *
     * @returns Actual platform version as string if possible to detect, undefined otherwise.
     */
    static async getPlatformVersion(): Promise<string | undefined> {
        let platformVersion: string | undefined;
        try {
            // @ts-ignore
            const ua = await navigator.userAgentData.getHighEntropyValues([UserAgent.PLATFORM_VERSION]);
            platformVersion = ua[UserAgent.PLATFORM_VERSION];
        } catch (e) {
            // do nothing
        }
        return platformVersion;
    }

    /**
     * Returns actual Windows version if it is parsed from user agent as Windows 10.
     *
     * @see {@link https://learn.microsoft.com/en-us/microsoft-edge/web-platform/how-to-detect-win11#sample-code-for-detecting-windows-11}.
     *
     * @returns Actual Windows version.
     */
    static async getActualWindowsVersion(version: string): Promise<string> {
        let actualVersion = version;
        const platformVersion = await UserAgent.getPlatformVersion();

        if (typeof platformVersion !== 'undefined') {
            const rawMajorPlatformVersion = platformVersion.split('.')[0];
            const majorPlatformVersion = rawMajorPlatformVersion && parseInt(rawMajorPlatformVersion, 10);

            if (!majorPlatformVersion
                || Number.isNaN(majorPlatformVersion)) {
                return actualVersion;
            }

            if (majorPlatformVersion >= UserAgent.MIN_WINDOWS_11_PLATFORM_VERSION) {
                actualVersion = UserAgent.WINDOWS_11_OS_VERSION;
            }
        }

        return actualVersion;
    }

    /**
     * Returns actual MacOS version if it is possible to detect, otherwise returns passed `version`.
     *
     * @param version MacOS version parsed from user agent.
     *
     * @returns Actual MacOS version.
     */
    static async getActualMacosVersion(version: string): Promise<string> {
        let actualVersion = version;
        const platformVersion = await UserAgent.getPlatformVersion();

        if (typeof platformVersion !== 'undefined') {
            actualVersion = platformVersion;
        }

        return actualVersion;
    }

    /**
     * Returns current system info — OS name and version.
     *
     * @returns System info as string if possible to detect, undefined otherwise.
     */
    static async getSystemInfo(): Promise<string | undefined> {
        let systemInfo: string = '';
        const osName = UserAgent.getSystemName();
        let osVersion = UserAgent.getSystemVersion();

        if (typeof osName !== 'undefined') {
            systemInfo += osName;
        }

        if (typeof osVersion !== 'undefined') {
            // windows 11 is parsed as windows 10 from user agent
            if (UserAgent.isWindows && osVersion === UserAgent.WINDOWS_10_OS_VERSION) {
                osVersion = await UserAgent.getActualWindowsVersion(osVersion);
            } else if (UserAgent.isMacOs) {
                // mac os version can be parsed from user agent as 10.15.7
                // so it also might be more specific version like 13.5.2
                osVersion = await UserAgent.getActualMacosVersion(osVersion);
            }
            systemInfo += ` ${osVersion}`;
        }

        if (systemInfo.length === 0) {
            return undefined;
        }

        return systemInfo;
    }

    /**
     * Check if the current platform is Android.
     * This method is more accurate than using UserAgent string,
     * because it uses the browser API to get the platform info.
     *
     * @returns True if the current platform is Android.
     */
    static async getIsAndroid(): Promise<boolean> {
        try {
            const { os } = await browser.runtime.getPlatformInfo();
            return os === UserAgent.ANDROID_OS_NAME;
        } catch {
            // If runtime.getPlatformInfo() is not supported, we fallback to the UserAgent string.
            return UserAgent.isAndroid;
        }
    }

    /**
     * Check if the current browser is as given.
     *
     * @param browserName Browser Name.
     *
     * @returns true, if current browser has specified name.
     */
    static isTargetBrowser(browserName: string): boolean {
        return UserAgent.parser.getBrowser().name === browserName;
    }

    /**
     * Check if current platform is as given.
     *
     * @param platformName Platform name.
     *
     * @returns true, if current browser has specified name.
     */
    static isTargetPlatform(platformName: string): boolean {
        return UserAgent.getSystemName() === platformName;
    }

    /**
     * Check if current engine is as given.
     *
     * @param engineName Engine name.
     *
     * @returns true, if current engine has specified name.
     */
    static isTargetEngine(engineName: string): boolean {
        return UserAgent.parser.getEngine().name === engineName;
    }

    static isTargetDeviceType(deviceType: string): boolean {
        return UserAgent.parser.getDevice().type === deviceType;
    }

    /**
     * Returns a major browser version.
     *
     * @returns browser version number or undefined.
     */
    static getVersion(): number | undefined {
        const browser = this.parser.getBrowser();
        const versionNumber = Number(browser.version?.split('.')[0]);
        return Number.isNaN(versionNumber) ? undefined : versionNumber;
    }

    static version = UserAgent.getVersion();

    static isChrome = UserAgent.isTargetBrowser('Chrome');

    static isFirefox = UserAgent.isTargetBrowser('Firefox');

    static isOpera = UserAgent.isTargetBrowser('Opera');

    static isYandex = UserAgent.isTargetBrowser('Yandex');

    static isEdge = UserAgent.isTargetBrowser('Edge');

    static isEdgeChromium = UserAgent.isEdge && !!(UserAgent.version && UserAgent.version >= 79);

    static isMacOs = UserAgent.isTargetPlatform('Mac OS');

    static isWindows = UserAgent.isTargetPlatform('Windows');

    static isAndroid = UserAgent.isTargetPlatform('Android');

    static isChromium = UserAgent.isTargetEngine('Blink');

    static isMobileDevice = UserAgent.isTargetDeviceType('mobile');

    static isFirefoxMobile = UserAgent.isFirefox && UserAgent.isMobileDevice;

    static isOculus = UserAgent.isTargetBrowser('Oculus Browser');

    static isSupportedBrowser = (UserAgent.isChrome && Number(UserAgent.version) >= MIN_SUPPORTED_VERSION.CHROMIUM_MV2)
        || (UserAgent.isEdgeChromium && Number(UserAgent.version) >= MIN_SUPPORTED_VERSION.EDGE_CHROMIUM)
        || (UserAgent.isFirefox && Number(UserAgent.version) >= MIN_SUPPORTED_VERSION.FIREFOX)
        || (UserAgent.isFirefoxMobile && Number(UserAgent.version) >= MIN_SUPPORTED_VERSION.FIREFOX_MOBILE)
        || (UserAgent.isOpera && Number(UserAgent.version) >= MIN_SUPPORTED_VERSION.OPERA);

    static browserName = UserAgent.getBrowserName();
}
