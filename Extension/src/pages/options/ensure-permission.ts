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

import { Permissions } from '../../common/permissions';
import { Log } from '../../common/log';
import { getErrorMessage } from '../../common/error';

/**
 * Handles privacy permission request.
 *
 * @param enable Flag is permission should be enabled.
 * @returns True if operation was successful, false if permission was not granted, or an error
 * occurred.
 */
export const ensurePermission = async (enable: boolean): Promise<boolean> => {
    // if setting disabled, no need to request permission
    if (!enable) {
        return true;
    }

    let hasPrivacyPermission = false;
    try {
        hasPrivacyPermission = await Permissions.hasPrivacy();
    } catch (e) {
        Log.error(getErrorMessage(e));
        return false;
    }

    // if permission already granted, no need to request permission
    if (hasPrivacyPermission) {
        return true;
    }

    try {
        return await Permissions.addPrivacy();
    } catch (e) {
        Log.error(getErrorMessage(e));
        return false;
    }
};
