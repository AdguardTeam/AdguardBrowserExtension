/**
 * @file
 * This file is part of Adguard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * Adguard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Adguard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Adguard Browser Extension. If not, see <http://www.gnu.org/licenses/>.
 */

// WICG Spec: https://wicg.github.io/ua-client-hints

// https://wicg.github.io/ua-client-hints/#navigatorua
declare global {
    interface Navigator {
        readonly userAgentData?: NavigatorUAData;
    }
}

// https://wicg.github.io/ua-client-hints/#dictdef-navigatoruabrandversion
interface NavigatorUABrandVersion {
    readonly brand: string;
    readonly version: string;
}

// https://wicg.github.io/ua-client-hints/#dictdef-uadatavalues
interface UADataValues {
    readonly brands?: NavigatorUABrandVersion[];
    readonly mobile?: boolean;
    readonly platform?: string;
    readonly architecture?: string;
    readonly bitness?: string;
    readonly model?: string;
    readonly platformVersion?: string;
    /** @deprecated in favour of fullVersionList */
    readonly uaFullVersion?: string;
    readonly fullVersionList?: NavigatorUABrandVersion[];
    readonly wow64?: boolean;
}

// https://wicg.github.io/ua-client-hints/#dictdef-ualowentropyjson
interface UALowEntropyJSON {
    readonly brands: NavigatorUABrandVersion[];
    readonly mobile: boolean;
    readonly platform: string;
}

// https://wicg.github.io/ua-client-hints/#navigatoruadata
interface NavigatorUAData extends UALowEntropyJSON {
    getHighEntropyValues(hints: string[]): Promise<UADataValues>;
    toJSON(): UALowEntropyJSON;
}

/**
 * Helper class for user agent data
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/User-Agent_Client_Hints_API#browser_compatibility
 */
export class UserAgent {
    static browserDataMap: Record<
        string,
        {
            uaStringName: string;
            brand?: string;
        }
    > = {
        Chrome: {
            brand: 'Google Chrome',
            uaStringName: 'Chrome',
        },
        Firefox: {
            uaStringName: 'Firefox',
        },
        Safari: {
            uaStringName: 'Safari',
        },
        Opera: {
            brand: 'Opera',
            uaStringName: 'OPR',
        },
        YaBrowser: {
            brand: 'Yandex',
            uaStringName: 'YaBrowser',
        },
        Edge: {
            uaStringName: 'edge',
        },
        EdgeChromium: {
            brand: 'Microsoft Edge',
            uaStringName: 'edg',
        },
    };

    /**
     * Gets current browser name
     *
     * @returns user agent browser name
     */
    static getBrowserName(): string | null {
        const brandsData = navigator?.userAgentData?.brands;

        const browserDataEntries = Object.entries(UserAgent.browserDataMap);

        for (let i = 0; i < browserDataEntries.length; i += 1) {
            const browserData = browserDataEntries[i];

            if (!browserData) {
                continue;
            }

            const [name, data] = browserData;

            if (brandsData?.some((brandData) => brandData.brand === data.brand)) {
                return name;
            }

            if (navigator.userAgent.indexOf(data.uaStringName) >= 0) {
                return name;
            }
        }

        return null;
    }

    /**
     * Check if current browser is as given
     *
     * @param browserName - Browser Name
     * @returns true, if current browser has specified name
     */
    static isTargetBrowser(browserName: string): boolean {
        const brand = UserAgent.browserDataMap[browserName]?.brand;
        const uaStringName = UserAgent.browserDataMap[browserName]?.uaStringName;

        const brandsData = navigator?.userAgentData?.brands;

        if ((!brandsData || !brand) && uaStringName) {
            return navigator.userAgent.indexOf(uaStringName) >= 0;
        }

        if (!brandsData) {
            return false;
        }

        for (let i = 0; i < brandsData.length; i += 1) {
            const data = brandsData[i];

            if (data?.brand === brand) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if current platform is as given
     *
     * @param platformName - Platform name
     * @returns true, if current browser has specified name
     */
    static isTargetPlatform(platformName: string): boolean {
        const platformString = navigator?.userAgentData?.platform;

        return platformString
            ? platformString.toUpperCase().indexOf(platformName) >= 0
            : navigator.userAgent.toUpperCase().indexOf(platformName) >= 0;
    }

    /**
     * Get browser version by name
     *
     * @param browserName - Browser Name
     * @returns browser version number or null
     */
    static getBrowserVersion(browserName: string): number | null {
        let brand: string | undefined;
        let uaStringMask: RegExp | undefined;

        if (browserName === 'Chrome') {
            brand = 'Google Chrome';
            uaStringMask = /\sChrome\/(\d+)\./;
        } else if (browserName === 'Firefox') {
            uaStringMask = /\sFirefox\/(\d+)\./;
        }

        const brandsData = navigator?.userAgentData?.brands;

        if (!brandsData || !brand) {
            const match = uaStringMask ? uaStringMask.exec(navigator.userAgent) : null;

            if (match?.[1]) {
                return Number.parseInt(match[1], 10);
            }

            return null;
        }

        for (let i = 0; i < brandsData.length; i += 1) {
            const data = brandsData[i];

            if (data?.brand === brand) {
                const { version } = data;
                return Number.parseInt(version, 10);
            }
        }

        return null;
    }

    static isChrome = UserAgent.isTargetBrowser('Chrome');

    static isFirefox = UserAgent.isTargetBrowser('Firefox');

    static isOpera = UserAgent.isTargetBrowser('Opera');

    static isYandex = UserAgent.isTargetBrowser('YaBrowser');

    static isEdge = UserAgent.isTargetBrowser('Edge');

    static isEdgeChromium = UserAgent.isTargetBrowser('EdgeChromium');

    static chromeVersion = UserAgent.getBrowserVersion('Chrome');

    static firefoxVersion = UserAgent.getBrowserVersion('Firefox');

    static operaVersion = UserAgent.getBrowserVersion('Opera');

    static isMacOs = UserAgent.isTargetPlatform('MAC');

    static isWindows = UserAgent.isTargetPlatform('WIN');

    static isAndroid = UserAgent.isTargetPlatform('ANDROID');

    static isSupportedBrowser =
        (UserAgent.isChrome && Number(UserAgent.chromeVersion) >= 79)
        || (UserAgent.isFirefox && Number(UserAgent.firefoxVersion) >= 78)
        || (UserAgent.isOpera && Number(UserAgent.operaVersion) >= 66);

    static browserName = UserAgent.getBrowserName();
}
