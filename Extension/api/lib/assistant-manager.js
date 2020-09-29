import { tabsApi } from '../../lib/tabs/tabs-api';

const initAssistant = function (tabId) {
    const assistantOptions = {
        addRuleCallbackName: 'assistant-create-rule',
    };
    tabsApi.sendMessage(tabId, {
        type: 'initAssistant',
        options: assistantOptions,
    });
};

/**
 * Opens assistant dialog in the specified tab
 * @param tabId Tab identifier
 */
const openAssistant = async (tabId) => {
    if (tabsApi.executeScriptFile) {
        // Load Assistant code to the activate tab immediately
        await tabsApi.executeScriptFile(null, { file: '/adguard/assistant/assistant.js' });
        initAssistant(tabId);
    } else {
        // Manually start assistant
        initAssistant(tabId);
    }
};

/**
 * Closes assistant dialog in the specified tab
 * @param tabId Tab identifier
 */
const closeAssistant = function (tabId) {
    tabsApi.sendMessage(tabId, {
        type: 'destroyAssistant',
    });
};

export {
    openAssistant,
    closeAssistant,
};
