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

import { ExtensionUpdateService } from 'extension-update-service';

import { RulesLimitsService } from 'rules-limits-service';

import { type IconData } from '../../../storages';

import { IconsApiCommon } from './icons-common';
import { defaultIconVariants } from './defaultIconVariants';

/**
 * Icons API implementation for MV3.
 */
class IconsApi extends IconsApiCommon {
    /**
     * Picks the icon variant based on the current extension state.
     *
     * Icon selection priority (highest to lowest):
     * 1. MV3 limits exceeded icon (warning) - when filter limits are exceeded
     * 2. Promo icons - when promotional notification is active
     * 3. Extension update icon - when extension update is available
     * 4. Default icon - fallback for normal operation (enabled/disabled).
     *
     * @param isDisabled Is website allowlisted or app filtering disabled.
     *
     * @returns Icon variant to display.
     */
    protected async pickIconVariant(isDisabled = false): Promise<IconData> {
        const isMv3LimitsExceeded = await RulesLimitsService.areFilterLimitsExceeded();

        if (isMv3LimitsExceeded) {
            return defaultIconVariants.warning;
        }

        // prioritize promo icons over the update-available icon,
        // i.e. PromoNotification is rendered on top of other notifications as well
        if (this.promoIcons) {
            return isDisabled
                ? this.promoIcons.disabled
                : this.promoIcons.enabled;
        }

        if (ExtensionUpdateService.getIsUpdateAvailable()) {
            return defaultIconVariants.updateAvailable;
        }

        return isDisabled
            ? defaultIconVariants.disabled
            : defaultIconVariants.enabled;
    }
}

export const iconsApi = new IconsApi();
