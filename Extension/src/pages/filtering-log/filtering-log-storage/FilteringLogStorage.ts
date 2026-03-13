/**
 * Copyright (c) 2015-2026 Adguard Software Ltd.
 *
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

import { LocalPageStorage } from '../../common/storage';

/**
 * Storage for filtering log page UI settings persisted in localStorage.
 *
 * Manages filtering log-specific UI preferences including:
 * - column widths for the filtering log table;
 * - request info modal width;
 * - preserve log modal visibility state.
 */
export class FilteringLogStorage extends LocalPageStorage {
    KEYS = {
        /**
         * Filtering log columns widths
         */
        COLUMNS_DATA: 'columns-data',

        /**
         * Request modal width
         */
        REQUEST_INFO_MODAL_WIDTH: 'request-info-modal-width',

        /**
         * Show preserve log modal state
         */
        SHOW_PRESERVE_LOG_MODAL: 'show-preserve-log-modal',
    };

    protected DEFAULTS = {
        [this.KEYS.REQUEST_INFO_MODAL_WIDTH]: null,
        [this.KEYS.COLUMNS_DATA]: {
            status: { width: 260 },
            url: { width: 260 },
            type: { width: 100 },
            rule: { width: 260 },
            filter: { width: 260 },
            source: { width: 200 },
        },
        [this.KEYS.SHOW_PRESERVE_LOG_MODAL]: true,
    };
}
