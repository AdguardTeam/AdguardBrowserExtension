import { start } from '../../lib/start';
import { webrequest } from '../../lib/webrequest';
import { requestSanitizer } from '../../lib/filter/request-sanitizer';
import { localeDetect } from '../../lib/filter/services/locale-detect';
import { ui } from '../../lib/ui-service';

// TODO move to separate module
const browserActionSupported = typeof browser.browserAction.setIcon !== 'undefined';
if (!browserActionSupported && browser.browserAction.onClicked) {
    // Open settings menu
    browser.browserAction.onClicked.addListener(() => {
        ui.openSettingsTab();
    });
}

start();
webrequest.init();
requestSanitizer.init();
localeDetect.init();
