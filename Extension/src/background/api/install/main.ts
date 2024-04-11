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
import { nanoid } from 'nanoid';

import {
    ADGUARD_SETTINGS_KEY,
    APP_VERSION_KEY,
    CLIENT_ID_KEY,
    SCHEMA_VERSION_KEY,
} from '../../../common/constants';
import { defaultSettings } from '../../../common/settings';
import { storage } from '../../storages';
import { RunInfo } from '../../utils';

/**
 * The Install API should set the base version of the schema and application,
 * generate a client ID and set default values if the extension has been installed.
 */
export class InstallApi {
    /**
     * Generate client id.
     *
     * @returns Client id string.
     */
    public static genClientId(): string {
        const suffix = (Date.now()) % 1e8;
        return nanoid(8) + suffix;
    }

    /**
     * Initializes app install.
     *
     * @param runInfo Info about extension start up.
     * @param runInfo.currentSchemaVersion Current data schema version.
     *
     */
    public static async install({ currentSchemaVersion }: RunInfo): Promise<void> {
        const clientId = InstallApi.genClientId();
        await storage.set(CLIENT_ID_KEY, clientId);

        await storage.set(SCHEMA_VERSION_KEY, currentSchemaVersion);

        await storage.set(ADGUARD_SETTINGS_KEY, defaultSettings);
    }

    /**
     * This method is called after a successful update of the extension.
     * If the extension installation is interrupted for some reason,
     * for example, if the user runs the extension in private mode and the initiation stops,
     * this method is not called. This ensures that actions needed upon
     * initialization will be called again since the version did not change.
     * Issue: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2713.
     *
     * @param currentAppVersion Current extension version.
     */
    public static async postSuccessInstall(currentAppVersion: string): Promise<void> {
        await storage.set(APP_VERSION_KEY, currentAppVersion);
    }
}
