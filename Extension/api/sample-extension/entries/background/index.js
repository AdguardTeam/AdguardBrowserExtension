

// Third party libraries
import '../../../../lib/libs/deferred';
import '../../../../lib/libs/sha256';
import '../../../../lib/utils/punycode';
// eslint-disable-next-line max-len
// TODO fix Module not found: Error: Can't resolve './node/file-download-wrapper' in '/Volumes/dev/browser-extension/Extension/lib/libs'
// import '../../../../lib/libs/filter-downloader';
import '../../../../lib/libs/crypto-js/core';
import '../../../../lib/libs/crypto-js/md5';
import '../../../../lib/libs/scriptlets/redirects';

// TS url filter
import '../../../../lib/libs/tsurlfilter';

// Adguard Global and preferences
import '../../../../lib/adguard';
import '../../../../lib/prefs';

// Utils libraries
import '../../../../lib/utils/common';
import '../../../../lib/utils/log';
import '../../../../lib/utils/public-suffixes';
import '../../../../lib/utils/url';
import '../../../../lib/notifier';
import '../../../../lib/utils/browser-utils';
import '../../../../lib/filter/filters/service-client';
import '../../../../lib/filter/page-stats';
import '../../../../lib/settings/user-settings';
import '../../../../lib/tabs/frames';
import '../../../../lib/utils/cookie';

// Local storage and rules storage libraries
import '../../../../lib/utils/local-storage';
import '../../../../lib/utils/rules-storage';
import '../../../../lib/storage';

// Chromium api adapter libraries
import '../../../../lib/content-script/common-script';
import '../../../../lib/api/background-page';

// // Tabs api library
import '../../../../lib/api/tabs';
import '../../../../lib/tabs/tabs-api';

// Services
import '../../../../lib/filter/services/css-service';

// // Filters metadata and filtration modules
import '../../../../lib/filter/engine';
import '../../../../lib/filter/filters/subscription';
import '../../../../lib/update-service';
import '../../../../lib/filter/whitelist';
import '../../../../lib/filter/userrules';
import '../../../../lib/filter/request-filter';
import '../../../../lib/filter/antibanner';
import '../../../../lib/filter/filtering-api';
import '../../../../lib/filter/filters/filters-state';
import '../../../../lib/filter/filters/filters-update';
import '../../../../lib/filter/request-blocking';
import '../../../../lib/filter/services/cookie-filtering';
import '../../../../lib/filter/filtering-log';
import '../../../../lib/filter/request-context-storage';

// Stealth
import '../../../../lib/filter/services/stealth-service';

// Content messaging
import '../../../../lib/content-message-handler';
import '../../../../lib/webrequest';
import '../../../../lib/application';
import '../../../chrome/lib/api';

// import sample
import '../../sample';
