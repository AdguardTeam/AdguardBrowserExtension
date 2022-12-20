/**
 * @file
 * This file is part of AdGuard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * AdGuard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * AdGuard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with AdGuard Browser Extension. If not, see <http://www.gnu.org/licenses/>.
 */

import { translator } from '../common/translators/translator';

export const getFilenameExtension = (filename) => {
    if (!filename) {
        return undefined;
    }
    const parts = filename.split('.');
    if (parts.length < 2) {
        return undefined;
    }
    return parts[parts.length - 1];
};

/**
 * Handles file upload
 *
 * @param file
 * @param requiredExtension
 * @returns {Promise<string>}
 */
export const handleFileUpload = (file, requiredExtension) => new Promise((resolve, reject) => {
    if (getFilenameExtension(file.name) !== requiredExtension) {
        reject(new Error(translator.getMessage(
            'options_popup_import_settings_wrong_file_ext',
            { extension: requiredExtension },
        )));
    }
    const reader = new FileReader();
    reader.readAsText(file, 'UTF-8');
    reader.onload = (evt) => {
        resolve(evt.target.result);
    };
    reader.onerror = () => {
        reject(new Error(translator.getMessage('options_popup_import_error_file_description')));
    };
});

export const hoursToMs = (hours) => {
    const MS_IN_HOUR = 1000 * 60 * 60;
    return hours * MS_IN_HOUR;
};

/**
 * Awaits required period of time
 *
 * @param timeoutMs
 * @returns {Promise<unknown>}
 */
export const sleep = (timeoutMs) => {
    return new Promise((resolve) => {
        setTimeout(resolve, timeoutMs);
    });
};

export const indexOfIgnoreCase = (str, searchString) => {
    return str.toLowerCase().indexOf(searchString.toLowerCase());
};

export const containsIgnoreCase = (str, searchString) => {
    return !!(str && searchString && indexOfIgnoreCase(str, searchString) >= 0);
};

export const findChunks = (str, searchString, chunks = []) => {
    const ind = indexOfIgnoreCase(str, searchString);
    if (ind > -1) {
        chunks.push(str.slice(0, ind));
        chunks.push(str.slice(ind, ind + searchString.length));
        const restStr = str.slice(ind + searchString.length);
        if (containsIgnoreCase(restStr, searchString)) {
            findChunks(restStr, searchString, chunks);
        } else {
            chunks.push(restStr);
        }
    }
    return chunks.filter((i) => !!i);
};

export const passiveEventSupported = (() => {
    let passiveSupported = null;

    return () => {
        // memoize support to avoid adding multiple test events
        if (typeof passiveSupported === 'boolean') {
            return passiveSupported;
        }

        let supported = false;
        try {
            const options = {
                get passive() {
                    supported = true;
                    return false;
                },
            };

            window.addEventListener('test', null, options);
            window.removeEventListener('test', null, options);
        } catch (err) {
            supported = false;
        }
        passiveSupported = supported;
        return passiveSupported;
    };
})();

export const copyToClipboard = (text) => {
    const textarea = document.createElement('textarea');
    textarea.innerText = text;
    textarea.style = `
        position: absolute;
        display: hidden;
        width: 0;
        height: 0;
    `;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
};

export const measureTextWidth = (text) => {
    const el = document.createElement('p');
    el.innerText = text;
    el.style = `
        position: absolute;
        display: hidden;
        height: 0;
        white-space: nowrap;
        font-family: Roboto, "Open Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Ubuntu, Arial, sans-serif;
        font-size: 14px;
    `;
    document.body.appendChild(el);
    const pxLength = el.clientWidth;
    el.remove();
    return pxLength;
};

/**
 * Сalculate the angle of radius vector of the scroll motion
 * and detect whether scroll is vertical
 *
 * @param {number} deltaY - wheel event deltaY value
 * @param {number} deltaX - wheel event deltaX value
 * @returns {boolean}
 */
export const isVerticalScroll = (() => {
    const degToRad = (deg) => deg * (Math.PI / 180);

    const deg60ToRad = degToRad(60);
    const deg90ToRad = degToRad(90);
    const deg120ToRad = degToRad(120);
    const deg240ToRad = degToRad(240);
    const deg270ToRad = degToRad(270);
    const deg300ToRad = degToRad(300);

    return (deltaY, deltaX) => {
        if (deltaY === 0) {
            return false;
        }
        let angle = Math.atan(deltaX / deltaY);
        angle = (deltaY > 0) ? angle + deg90ToRad : angle + deg270ToRad;
        return (angle > deg60ToRad && angle < deg120ToRad)
            || (angle > deg240ToRad && angle < deg300ToRad);
    };
})();

/**
 * Checks the length of the array with filters and returns the contents for notification
 *
 * @param updatedFilters
 */
export const updateFilterDescription = (updatedFilters) => {
    if (!updatedFilters) {
        return {
            title: translator.getMessage('options_popup_update_title_error'),
            description: translator.getMessage('options_popup_update_error'),
        };
    }
    const filterNames = updatedFilters.map((filter) => filter.name).join(', ');
    let description;
    if (updatedFilters.length === 0) {
        description = `${filterNames} ${translator.getMessage('options_popup_update_not_found')}`;
    } else if (updatedFilters.length === 1) {
        description = `${filterNames} ${translator.getMessage('options_popup_update_filter')}`;
    } else if (updatedFilters.length > 1) {
        description = `${filterNames} ${translator.getMessage('options_popup_update_filters')}`;
    }

    return { description };
};
