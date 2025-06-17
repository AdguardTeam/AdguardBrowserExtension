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

import { logger } from '../../../common/logger';

/**
 * Module used to keep options page settings, which do not need extension level persistence
 */
export class OptionsStorage {
    KEYS = {
        /**
         * Allowlist editor wrap setting
         */
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

    /**
     * Storage object
     */
    private storage: Storage;

    constructor() {
        this.storage = localStorage;
    }

    /**
     * Set item to storage.
     *
     * @param key Key
     * @param value Value
     */
    setItem(key: string, value: any): void {
        try {
            this.storage.setItem(key, JSON.stringify(value));
        } catch (e) {
            logger.debug(e);
        }
    }

    /**
     * Get item from storage.
     *
     * @param key Key
     */
    getItem(key: string): any {
        let storedValue = null;
        const item = this.storage.getItem(key);
        if (item !== null) {
            try {
                storedValue = JSON.parse(item);
            } catch (e) {
                logger.debug(e);
            }
        }

        return storedValue === null ? this.DEFAULTS[key] : storedValue;
    }
}
