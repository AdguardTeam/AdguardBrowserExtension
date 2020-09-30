import { start } from '../../lib/start';
import { webrequest } from '../../lib/webrequest';
import { requestSanitizer } from '../../lib/filter/request-sanitizer';
import { localeDetect } from '../../lib/filter/services/locale-detect';
import { contentMessageHandler } from '../../lib/content-message-handler';
import { tabsApi } from '../../lib/tabs/tabs-api';

start();
webrequest.init();
requestSanitizer.init();
localeDetect.init();
contentMessageHandler.init();

window.adguard = {
    tabs: tabsApi,
};
