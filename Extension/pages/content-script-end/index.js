/**
 * !IMPORTANT Only chrome based browsers support devtools, we cut off devtools for other browsers
 */
/* @if devtools == true */
import { devtools } from '../../src/content-script/devtools/devtools';
/* @endif */

import { startAssistant } from '../../src/content-script/assistant/start-assistant';

startAssistant();

/* @if devtools == true */
devtools.init();
/* @endif */
