import browser from 'webextension-polyfill';

export const i18n = {
    getMessage: browser.i18n.getMessage,
    getUILanguage: browser.i18n.getUILanguage,
    getBaseMessage: (key) => key,
    getBaseUILanguage: () => 'en',
};
