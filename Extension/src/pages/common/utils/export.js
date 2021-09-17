/**
 * This file is part of Adguard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * Adguard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Adguard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Adguard Browser Extension. If not, see <http://www.gnu.org/licenses/>.
 */
import { format } from 'date-fns';

import { runtimeImpl } from '../../../common/common-script';
import { MESSAGE_TYPES } from '../../../common/constants';

/**
 * Export types.
 * @readonly
 * @enum {string}
 */
export const ExportTypes = {
    USER_FILTER: 'user_filter',
    ALLOW_LIST: 'allow_list',
    SETTINGS: 'settings',
};

const exportMetadata = {
    [ExportTypes.USER_FILTER]: {
        name: 'user_rules',
        messageType: MESSAGE_TYPES.GET_USER_RULES,
        ext: 'txt',
    },
    [ExportTypes.ALLOW_LIST]: {
        name: 'allowlist',
        messageType: MESSAGE_TYPES.GET_ALLOWLIST_DOMAINS,
        ext: 'txt',
    },
    [ExportTypes.SETTINGS]: {
        name: 'settings',
        messageType: MESSAGE_TYPES.LOAD_SETTINGS_JSON,
        ext: 'json',
    },
};

/**
 * @param {ExportTypes} type
 */
export const exportData = async (type) => {
    const {
        messageType,
        name,
        ext,
    } = exportMetadata[type];

    const currentTimeString = format(Date.now(), 'yyyyMMdd_HHmmss');
    const { content, appVersion } = await runtimeImpl.sendMessage({ type: messageType });
    const filename = `${currentTimeString}_adg_ext_${name}_${appVersion}.${ext}`;

    const blob = new Blob([content]);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.style.display = 'none';
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
};
