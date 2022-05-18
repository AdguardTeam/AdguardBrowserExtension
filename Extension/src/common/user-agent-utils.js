/**
 * Check if current browser is as given
 * @param {string} browserName
 * @returns {boolean}
 */
const isTargetBrowser = (browserName) => {
    let brand;
    let uaStringName;

    if (browserName === 'Chrome') {
        brand = 'Google Chrome';
        uaStringName = 'Chrome';
    } else if (browserName === 'Firefox') {
        uaStringName = 'Firefox';
    } else if (browserName === 'Safari') {
        uaStringName = 'Safari';
    } else if (browserName === 'Opera') {
        brand = 'Opera';
        uaStringName = 'OPR';
    } else if (browserName === 'YaBrowser') {
        brand = 'Yandex';
        uaStringName = 'YaBrowser';
    } else if (browserName === 'Edge') {
        uaStringName = 'edge';
    } else if (browserName === 'EdgeChromium') {
        brand = 'Microsoft Edge';
        uaStringName = 'edg';
    }

    const brandsData = navigator.userAgentData?.brands;
    if (!brandsData || !brand) {
        return navigator.userAgent.indexOf(uaStringName) >= 0;
    }

    // eslint-disable-next-line no-restricted-syntax
    for (const data of brandsData) {
        if (data.brand === brand) {
            return true;
        }
    }
    return false;
};

/**
 * Check if current platform is as given
 * @param {string} platformName
 * @returns
 */
const isTargetPlatform = (platformName) => {
    const platformString = navigator.userAgentData?.platform;

    return platformString
        ? platformString.toUpperCase().indexOf(platformName) >= 0
        : navigator.userAgent.toUpperCase().indexOf(platformName) >= 0;
};

/**
 * Get browser version by name
 * @param {string} browserName
 * @returns {number|null}
 */
const getBrowserVersion = (browserName) => {
    let brand;
    let uaStringMask;

    if (browserName === 'Chrome') {
        brand = 'Google Chrome';
        uaStringMask = /\sChrome\/(\d+)\./;
    } else if (browserName === 'Firefox') {
        uaStringMask = /\sFirefox\/(\d+)\./;
    }

    const brandsData = navigator.userAgentData?.brands;
    if (!brandsData || !brand) {
        const match = uaStringMask.exec(navigator.userAgent);
        return match === null ? null : Number.parseInt(match[1], 10);
    }

    // eslint-disable-next-line no-restricted-syntax
    for (const data of brandsData) {
        if (data.brand === brand) {
            const { version } = data;
            return Number.parseInt(version, 10);
        }
    }
    return null;
};

export const isChrome = isTargetBrowser('Chrome');
export const isFirefox = isTargetBrowser('Firefox');
export const isOpera = isTargetBrowser('Opera');
export const isYaBrowser = isTargetBrowser('YaBrowser');
export const isEdge = isTargetBrowser('Edge');
export const isEdgeChromium = isTargetBrowser('EdgeChromium');

export const chromeVersion = getBrowserVersion('Chrome');
export const firefoxVersion = getBrowserVersion('Firefox');

export const isMacOs = isTargetPlatform('MAC');
export const isWindowsOs = isTargetPlatform('WIN');
export const isAndroid = isTargetPlatform('ANDROID');
