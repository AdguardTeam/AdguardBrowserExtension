/**
 * !IMPORTANT Only chrome based browsers support devtools, we cut off devtools for other browsers
 */
/* @if devtools == true */
import { devtools } from '../../lib/content-script/devtools/devtools';
/* @endif */

import { startAssistant } from '../../lib/content-script/assistant/start-assistant';

// TODO check work of assistant
startAssistant();

/* @if devtools == true */
devtools.init();
/* @endif */
