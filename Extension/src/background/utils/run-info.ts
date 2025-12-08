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
import zod from 'zod';

import {
    ADGUARD_SETTINGS_KEY,
    APP_SCHEMA_VERSION,
    APP_VERSION_KEY,
    CLIENT_ID_KEY,
    SCHEMA_VERSION_KEY,
} from '../../common/constants';
import { Prefs } from '../prefs';
import { browserStorage } from '../storages';

export type RunInfo = {
    currentAppVersion: string;
    previousAppVersion: string | null;
    currentSchemaVersion: number;
    previousSchemaVersion: number;
    clientId: string | null;
};

/**
 * Gets data from storage by specified key.
 *
 * @param key Storage key.
 * @param fallback If true, try to get data from legacy destination.
 *
 * @returns Specified storage value.
 */
async function getData(key: string, fallback = true): Promise<unknown | null> {
    const data = await browserStorage.get(key);

    if (data) {
        return data;
    }

    // Before v4.2, app version and client id were stored in settings
    if (fallback) {
        const settings = await browserStorage.get(ADGUARD_SETTINGS_KEY);

        const result = zod.record(zod.unknown()).safeParse(settings);

        if (result.success && key in result.data) {
            return result.data[key];
        }
    }

    return null;
}

/**
 * Get client id from storage.
 *
 * @returns Client id or null.
 */
async function getClientId(): Promise<string | null> {
    const clientId = await getData(CLIENT_ID_KEY);

    if (typeof clientId === 'string') {
        return clientId;
    }

    return null;
}

/**
 * Get app version from storage.
 *
 * @returns App version or null.
 */
async function getAppVersion(): Promise<string | null> {
    const appVersion = await getData(APP_VERSION_KEY);

    if (typeof appVersion === 'string') {
        return appVersion;
    }

    return null;
}

/**
 * Get schema version from storage.
 *
 * @returns Schema version or 0.
 */
async function getSchemaVersion(): Promise<number> {
    // don't search schema version in legacy source, because it was added in v4.2
    const schemaVersion = await getData(SCHEMA_VERSION_KEY, false);

    if (typeof schemaVersion === 'number') {
        return schemaVersion;
    }

    // If schema version is not exist, returns legacy v0
    return 0;
}

/**
 * Gets app running info from storage.
 *
 * @returns App running info.
 */
export async function getRunInfo(): Promise<RunInfo> {
    const currentAppVersion = Prefs.version;

    const currentSchemaVersion = APP_SCHEMA_VERSION;

    const previousAppVersion = await getAppVersion();

    const previousSchemaVersion = await getSchemaVersion();

    const clientId = await getClientId();

    return {
        previousAppVersion,
        currentAppVersion,
        currentSchemaVersion,
        previousSchemaVersion,
        clientId,
    };
}
