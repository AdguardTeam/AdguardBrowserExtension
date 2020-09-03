import { start } from '../../lib/start';
import { webrequest } from '../../lib/webrequest';
import { requestSanitizer } from '../../lib/filter/request-sanitizer';
import { localeDetect } from '../../lib/filter/services/locale-detect';

start();
webrequest.init();
requestSanitizer.init();
localeDetect.init();
