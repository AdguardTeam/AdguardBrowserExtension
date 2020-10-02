import { preload } from '../../lib/content-script/preload';
import { contentUtils } from '../../lib/content-script/content-utils';
import { subscribe } from '../../lib/content-script/subscribe';

preload.init();
contentUtils.init();
subscribe.init();
