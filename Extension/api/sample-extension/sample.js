/* eslint-disable no-console */

/* global adguardApi */

// Init the configuration
const configuration = {
    // Adguard English filter alone
    filters: [2],

    // Adguard is disabled on www.avira.com
    whitelist: ['www.avira.com'],

    // Array of custom rules
    rules: ['example.org##h1'],

    // Filters metadata file path
    filtersMetadataUrl: 'https://filters.adtidy.org/extension/chromium/filters.json',

    // Filter file mask
    filterRulesUrl: 'https://filters.adtidy.org/extension/chromium/filters/{filter_id}.txt',
};

// Add event listener for blocked requests
const onBlocked = function (details) {
    console.log(details);
};

adguardApi.onRequestBlocked.addListener(onBlocked);

// Add event listener for rules created by Adguard Assistant
chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'assistant-create-rule') {
        const { token, ruleText } = message.data;
        const expectedToken = adguardApi.getAssistantToken();
        // check for token to avoid possible vulnerabilities AG-12883
        // https://groups.google.com/a/chromium.org/g/chromium-extensions/c/0ei-UCHNm34/m/lDaXwQhzBAAJ?pli=1
        // https://bugs.chromium.org/p/chromium/issues/detail?id=982326
        if (token !== expectedToken) {
            // eslint-disable-next-line max-len
            console.error(`Tokens for message ${message} does not not match. Expected token: ${token}. Received token: ${expectedToken}`);
            return;
        }

        console.log(`Rule ${ruleText} was created by Adguard Assistant`);
        configuration.rules.push(ruleText);
        adguardApi.configure(configuration, () => {
            console.log('Finished Adguard API re-configuration');
        });
    }
});

adguardApi.start(configuration, () => {
    console.log('Finished Adguard API initialization.');

    // Now we want to disable Adguard on www.google.com
    configuration.whitelist.push('www.google.com');
    adguardApi.configure(configuration, () => {
        console.log('Finished Adguard API re-configuration');
    });
});

// Disable Adguard in 1 minute
setTimeout(() => {
    adguardApi.onRequestBlocked.removeListener(onBlocked);
    adguardApi.stop(() => {
        console.log('Adguard API has been disabled.');
    });
}, 60 * 1000);
