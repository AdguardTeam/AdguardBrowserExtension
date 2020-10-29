import browser from 'webextension-polyfill';

const translate = (key) => browser.i18n.getMessage(key);

const i18n = {
    translate,
};

export { i18n };
