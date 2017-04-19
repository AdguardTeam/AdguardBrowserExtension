document.addEventListener('DOMContentLoaded', function () {
    // Init
    var openAssistantButton = document.getElementById("openAssistant");
    openAssistantButton.addEventListener("click", function () {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            var currentTab = tabs[0];
            var url = currentTab.url;
            console.log('Opening Assistant UI for tab id=' + currentTab.id + ' url=' + url);
            var backgroundPage = chrome.extension.getBackgroundPage();
            var adguardApi = backgroundPage.adguardApi;
            adguardApi.openAssistant(currentTab.id);
            window.close();
        });
    });
});