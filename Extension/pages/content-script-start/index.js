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
