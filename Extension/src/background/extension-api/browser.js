import browser from 'webextension-polyfill';
import { patchWindows } from './windows';

patchWindows(browser);

export { browser };
