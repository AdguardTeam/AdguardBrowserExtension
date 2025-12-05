/**
 * Copyright (c) 2015-2025 Adguard Software Ltd.
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

import { format } from 'date-fns';

import { messenger } from '../../services/messenger';

/**
 * Export types.
 *
 * @readonly
 * @enum {string}
 */
export const enum ExportTypes {
    UserFilter = 'user_filter',
    Allowlist = 'allow_list',
    Settings = 'settings',
}

const exportMetadata = {
    [ExportTypes.UserFilter]: {
        name: 'user_rules',
        getData: () => messenger.getUserRules(),
        ext: 'txt',
    },
    [ExportTypes.Allowlist]: {
        name: 'allowlist',
        getData: () => messenger.getAllowlistDomains(),
        ext: 'txt',
    },
    [ExportTypes.Settings]: {
        name: 'settings',
        getData: () => messenger.loadSettingsJson(),
        ext: 'json',
    },
};

/**
 * Generates filename for exported `type`.
 *
 * @param type Type of export
 * @param appVersion App version
 *
 * @returns Filename
 */
export const getExportedSettingsFilename = (type: ExportTypes, appVersion: string) => {
    const { name, ext } = exportMetadata[type];
    const product = `adg_ext_${name}`;
    const currentTimeString = format(Date.now(), 'ddMMyy-HHmmss');
    return `${product}_${appVersion}_${currentTimeString}.${ext}`;
};

/**
 * Exports data to file and downloads it in browser.
 *
 * @param type Type of export
 */
export const exportData = async (type: ExportTypes) => {
    const { getData } = exportMetadata[type];
    const { content, appVersion } = await getData();
    const filename = getExportedSettingsFilename(type, appVersion);
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
