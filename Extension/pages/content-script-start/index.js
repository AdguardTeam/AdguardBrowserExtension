import { preload } from '../../src/content-script/preload';
import { contentUtils } from '../../src/content-script/content-utils';
import { contentPage } from '../../src/content-script/content-script';
import { subscribeToScriptlets } from '../../src/content-script/subscribe-to-scriptlets';

// expose content page for subscribe.js
global.contentPage = contentPage;

preload.init();
contentUtils.init();
subscribeToScriptlets.init();
