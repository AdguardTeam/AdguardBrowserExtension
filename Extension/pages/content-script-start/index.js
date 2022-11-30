// eslint-disable-next-line import/no-unresolved
import '@adguard/tswebextension/content-script';

import { contentUtils } from '../../src/content-script/content-utils';
import { contentPage } from '../../src/content-script/content-script';
import { subscribeToScriptlets } from '../../src/content-script/subscribe-to-scriptlets';

// expose content page for subscribe.js
global.contentPage = contentPage;

contentUtils.init();
subscribeToScriptlets.init();
