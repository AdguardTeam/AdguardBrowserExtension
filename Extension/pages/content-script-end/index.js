/**
 * !IMPORTANT Only chrome based browsers support devtools, we cut off devtools for other browsers
 */
/* @if devtools == true */
import { devtools } from '../../src/content-script/devtools/devtools';

devtools.init();
/* @endif */
