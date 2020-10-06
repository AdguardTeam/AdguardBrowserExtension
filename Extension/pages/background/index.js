import { start } from '../../src/background/start';
import { webrequest } from '../../src/background/webrequest';
import { requestSanitizer } from '../../src/background/filter/request-sanitizer';
import { localeDetect } from '../../src/background/filter/services/locale-detect';
import { contentMessageHandler } from '../../src/background/content-message-handler';
import { localStorage } from '../../src/background/storage';
import { documentFilterService } from '../../src/background/filter/services/document-filter';
import { safebrowsing } from '../../src/background/filter/services/safebrowsing';
import { tabsApi } from '../../src/background/tabs/tabs-api';

start();
webrequest.init();
requestSanitizer.init();
localeDetect.init();
contentMessageHandler.init();

window.adguard = {
    // exposed for options page
    localStorage,
    // exposed for adBlockedPage
    documentFilterService,
    // exposed for safebrowsing
    safebrowsing,
    tabs: tabsApi,
};
