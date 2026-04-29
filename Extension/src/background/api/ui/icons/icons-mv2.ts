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

import {
    appContext,
    AppContextKey,
    type IconData,
} from '../../../storages';
import { SearchPageAccessService } from '../../../services/searchPageAccessService';

import { IconsApiCommon } from './icons-common';
import { defaultIconVariants } from './defaultIconVariants';

/**
 * Icons API implementation for MV2.
 */
class IconsApi extends IconsApiCommon {
    /**
     * Picks the icon variant based on the current extension state.
     *
     * Icon selection priority (highest to lowest):
     * 1. Loading icon if the extension is not initialized yet.
     * 2. Opera search permission warning - when permission is not granted
     * 3. Promo icons - when promotional notification is active
     * 4. Default icon - fallback for normal operation (enabled/disabled).
     *
     * @param isDisabled Is website allowlisted or app filtering disabled.
     *
     * @returns Icon variant to display.
     */
    protected async pickIconVariant(isDisabled = false): Promise<IconData> {
        if (!appContext.get(AppContextKey.IsInit)) {
            return defaultIconVariants.loading;
        }

        const shouldShowOperaWarning = await SearchPageAccessService.shouldShowNotification();
        if (shouldShowOperaWarning) {
            return defaultIconVariants.warning;
        }

        // prioritize promo icons over the update-available icon,
        // i.e. PromoNotification is rendered on top of other notifications as well
        if (this.promoIcons) {
            return isDisabled
                ? this.promoIcons.disabled
                : this.promoIcons.enabled;
        }

        return isDisabled
            ? defaultIconVariants.disabled
            : defaultIconVariants.enabled;
    }
}

export const iconsApi = new IconsApi();
