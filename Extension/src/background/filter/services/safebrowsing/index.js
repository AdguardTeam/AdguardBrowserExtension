/**
 * !IMPORTANT!
 * `./safebrowsing.__ABSTRACT_API__` should be replaced during bundling with webpack with proper module
 *  - safebrowsing.adguard-api.js - for adguard-api
 *  - safebrowsing.browsers.js - for other browsers
 */

import safebrowsing from './safebrowsing.__ABSTRACT_API__';

export { safebrowsing };
