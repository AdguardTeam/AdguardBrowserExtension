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

import { Log } from '../../../common/log';
/**
 * Module used to keep options page settings, which do not need extension level persistence
 */
export class OptionsStorage {
    KEYS = {
        /* allowlist editor wrap setting */
        ALLOWLIST_EDITOR_WRAP: 'allowlist-editor-wrap',

        /**
         * Filtering log columns widths
         */
        COLUMNS_WIDTHS_PX: 'columns-widths-px',

        /**
         * Filtering log columns widths
         */
        COLUMNS_DATA: 'columns-data',

        /**
         * Request modal width
         */
        REQUEST_INFO_MODAL_WIDTH: 'request-info-modal-width',
    };

    DEFAULTS = {
        [this.KEYS.ALLOWLIST_EDITOR_WRAP]: false,
        [this.KEYS.REQUEST_INFO_MODAL_WIDTH]: null,
        [this.KEYS.COLUMNS_DATA]: {
            status: { width: 260 },
            url: { width: 260 },
            type: { width: 100 },
            rule: { width: 260 },
            filter: { width: 260 },
            source: { width: 200 },
        },
    };

    constructor() {
        this.storage = localStorage;
    }

    setItem(key, value) {
        try {
            this.storage.setItem(key, JSON.stringify(value));
        } catch (e) {
            Log.debug(e);
        }
    }

    getItem(key) {
        let storedValue;
        try {
            storedValue = JSON.parse(this.storage.getItem(key));
        } catch (e) {
            Log.debug(e);
            storedValue = null;
        }

        return storedValue === null ? this.DEFAULTS[key] : storedValue;
    }
}
