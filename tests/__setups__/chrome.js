const chrome = require('sinon-chrome');
const { version } = require('../../package.json');

// used to test devtools constructor
require('css.escape');

chrome.runtime.getManifest.returns({
    version,
});

global.chrome = chrome;
