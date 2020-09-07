// "lib/content-script/i18n-helper.js",

// TODO remove redundant dependencies from package.json

import { devtools } from '../../lib/content-script/devtools/devtools';
import { startAssistant } from '../../lib/content-script/assistant/start-assistant';

// TODO check work of assistant
startAssistant();
devtools.init();
