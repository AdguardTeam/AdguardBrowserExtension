// "lib/libs/TSUrlFilterContentScript.js",
//     "lib/utils/element-collapser.js",
//     "lib/content-script/adguard-content.js",
//     "lib/content-script/common-script.js",
//     "lib/content-script/content-script.js",
//     "lib/content-script/wrappers.js",
//     "lib/content-script/preload.js"

import { preload } from '../../lib/content-script/preload';

preload.init();

// TODO add this scripts to the webpack
// {
//     "all_frames": true,
//     "css": [
//     "lib/content-script/css/alert-popup.css"
// ],
//     "js": [
//     "lib/content-script/content-utils.js"
// ],
//     "matches": [
//     "http://*/*",
//     "https://*/*"
// ],
//     "match_about_blank": true,
//     "run_at": "document_start"
// },
// {
//     "all_frames": false,
//     "js": [
//     "lib/pages/thankyou.js"
// ],
//     "matches": [
//     "*://*.adguard.com/*/thankyou.html*"
// ],
//     "run_at": "document_start"
// }

console.log('test');
