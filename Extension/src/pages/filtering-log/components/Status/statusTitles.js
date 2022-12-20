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

import { StatusMode } from '../../filteringLogStatus';
import { reactTranslator } from '../../../../common/translators/reactTranslator';

/**
 * @typedef {object} StatusTitle
 * @property {string} PROCESSED
 * @property {string} BLOCKED
 * @property {string} MODIFIED
 * @property {string} UNBLOCKED
 */
const StatusTitle = {
    PROCESSED: 'filtering_log_status_processed',
    BLOCKED: 'filtering_log_status_blocked',
    MODIFIED: 'filtering_log_status_modified',
    UNBLOCKED: 'filtering_log_status_allowed',
};

const titleMap = {
    [StatusMode.REGULAR]: StatusTitle.PROCESSED,
    [StatusMode.MODIFIED]: StatusTitle.MODIFIED,
    [StatusMode.BLOCKED]: StatusTitle.BLOCKED,
    [StatusMode.ALLOWED]: StatusTitle.UNBLOCKED,
};

export const getStatusTitle = (mode) => {
    return reactTranslator.getMessage(titleMap[mode]);
};
