import { start } from '../../lib/start';
import { webrequest } from '../../lib/webrequest';
import { requestSanitizer } from '../../lib/filter/request-sanitizer';
import { localeDetect } from '../../lib/filter/services/locale-detect';
import { contentMessageHandler } from '../../lib/content-message-handler';
import { localStorage } from '../../lib/storage';
import { documentFilterService } from '../../lib/filter/services/document-filter';
import { safebrowsing } from '../../lib/filter/services/safebrowsing';
import { tabsApi } from '../../lib/tabs/tabs-api';

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
