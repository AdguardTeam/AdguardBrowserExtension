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
import { BrowserUtils } from './browser-utils';

/**
 * First version published to the Edge Add-ons listing as MV3.
 * Every earlier version on that listing is MV2.
 */
const FIRST_MV3_VERSION = '5.5.3';

/**
 * Detects the update of the Edge Add-ons extension from its MV2 build to its MV3 build.
 *
 * TODO (AG-59537): Remove it with the rest of the migration popup code
 * once Edge users have moved to MV3.
 */
export class EdgeMv3Migration {
    /**
     * Whether this is the edge-mv3 build. Other MV3 builds can run in Edge too
     * (e.g. chrome-mv3 installed from the Chrome Web Store), but they have never been MV2 there.
     */
    public static isEdgeMv3Build = IS_EDGE_MV3;

    /**
     * Checks whether the update is the Edge MV2 to MV3 migration.
     *
     * @param previousVersion Extension version before the update.
     * @param currentVersion Extension version after the update.
     *
     * @returns True if this is the edge-mv3 build and the update crosses
     * {@link FIRST_MV3_VERSION}, otherwise false.
     */
    public static isMigrationUpdate(previousVersion: string, currentVersion: string): boolean {
        if (!EdgeMv3Migration.isEdgeMv3Build) {
            return false;
        }

        return !BrowserUtils.isGreaterOrEqualsVersion(previousVersion, FIRST_MV3_VERSION)
            && BrowserUtils.isGreaterOrEqualsVersion(currentVersion, FIRST_MV3_VERSION);
    }
}
