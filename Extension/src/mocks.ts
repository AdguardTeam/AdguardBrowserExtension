/* eslint-disable jsdoc/require-file-overview */
/* eslint-disable @typescript-eslint/no-unused-vars */

export const getDomain = (url: string) => '';

export const isHttpRequest = (url: string) => true;

export const isHttpOrWsRequest = (url: string) => true;

export const tsWebExtTabsApi = {
    getTabContext: (tabId: number) => null,
    isIncognitoTab: (tabId: number) => false,
};

export const tabsApi = {
    getTabFrame: (tabId: number, frameId: number) => null,
};

export const MAIN_FRAME_ID = 0;
