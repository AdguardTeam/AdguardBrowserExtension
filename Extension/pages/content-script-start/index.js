import { preload } from '../../lib/content-script/preload';
import { contentUtils } from '../../lib/content-script/content-utils';
import { contentPage } from '../../lib/content-script/content-script';

// expose content page for subscribe.js
global.contentPage = contentPage;

preload.init();
contentUtils.init();
