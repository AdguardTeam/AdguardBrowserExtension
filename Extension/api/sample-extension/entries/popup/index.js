document.addEventListener('DOMContentLoaded', () => {
    // Init
    const openAssistantButton = document.getElementById('openAssistant');
    openAssistantButton.addEventListener('click', () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const currentTab = tabs[0];
            const { url } = currentTab;
            // eslint-disable-next-line no-console
            console.log(`Opening Assistant UI for tab id=${currentTab.id} url=${url}`);
            chrome.runtime.sendMessage({ type: 'openAssistantInTab', tabId: currentTab.id });
            window.close();
        });
    });
});
