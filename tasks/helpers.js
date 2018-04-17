import fs from 'fs';
import path from 'path';
import pp from 'preprocess';

export function updateLocalesMSGName (branch, dest, done, browser, allowRemoteScripts) {
    let extensionNamePostfix = '';

    switch (browser) {
        case 'FIREFOX_LEGACY':
            if (branch == 'beta') {
                extensionNamePostfix = " (Legacy)";
            } else if (branch == 'dev') {
                extensionNamePostfix = " (Legacy Dev)";
            }
            break;
        case 'FIREFOX_WEBEXT':
            if (allowRemoteScripts) {
                if (branch == 'beta') {
                    extensionNamePostfix = " (Standalone)";
                } else if (branch == 'dev') {
                    extensionNamePostfix = " (Standalone Dev)";
                }
            } else {
                if (branch == 'beta') {
                    extensionNamePostfix = " (Beta)";
                } else if (branch == 'dev') {
                    extensionNamePostfix = " (AMO Dev)";
                }
            }
            break;
        default:
            if (branch != 'release') {
                extensionNamePostfix = " (" + capitalize(branch) + ")";
            }
            break;
    }

    const locales = fs.readdirSync(dest + '_locales/');

    for (let i of locales) {
        let file = path.join(dest, '_locales', i, 'messages.json');
        let messages = JSON.parse(fs.readFileSync(file));

        if (messages.name) {
            messages.name.message = messages.name.message + extensionNamePostfix;
        }

        if (messages.short_name) {
            messages.short_name.message = messages.short_name.message + extensionNamePostfix;
        }

        fs.writeFileSync(file, JSON.stringify(messages, null, 4));
    }

    return done();
}

/**
 * Preprocess files. See docs: https://github.com/jsoverson/preprocess#what-does-it-look-like
 *
 * @param dest   src folder. In our task src and destination folder are the same
 * @param data   params to preprocess
 * @param done
 * @return done
 */
export function preprocessAll (dest, data, done) {
    const popupHTML = dest + 'pages/popup.html';
    const filterHTML = dest + 'pages/filter-download.html';
    const thankyouHTML = dest + 'pages/thankyou.html';
    const exportHTML = dest + 'pages/export.html';
    const logHTML = dest + 'pages/log.html';
    const optionsHTML = dest + 'pages/options.html';
    const sbHTML = dest + 'pages/sb.html';
    const filtersJS = dest + 'lib/filter/filters.js';
    pp.preprocessFileSync(popupHTML, popupHTML, data);
    pp.preprocessFileSync(filterHTML, filterHTML, data);
    pp.preprocessFileSync(thankyouHTML, thankyouHTML, data);
    pp.preprocessFileSync(exportHTML, exportHTML, data);
    pp.preprocessFileSync(logHTML, logHTML, data);
    pp.preprocessFileSync(optionsHTML, optionsHTML, data);
    pp.preprocessFileSync(sbHTML, sbHTML, data);
    pp.preprocessFileSync(filtersJS, filtersJS, data);
    return done();
}

export function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
