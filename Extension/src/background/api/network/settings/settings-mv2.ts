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
import { UserAgent } from '../../../../common/user-agent';
import { logger } from '../../../../common/logger';
import { browserStorage } from '../../../storages/shared-instances';

import { NetworkSettingsCommon } from './settings-common';

/**
 * NetworkSettings contains a bunch of url's which are using by extension.
 */
export class NetworkSettings extends NetworkSettingsCommon {
    /**
     * By this key, qa can set the base url for filter rules through the local storage for testing
     * purposes.
     *
     * @example
     * ```javascript
     *  localStorage.setItem('ag_filters_base_url', 'https://filters.adtidy.org/extension/');
     * ```
     */
    private readonly FILTERS_BASE_URL_KEY = 'ag_filters_base_url';

    /**
     * Used to set the base url for filter rules through the local storage
     * for testing purposes.
     *
     * @returns Promise that resolves to the base url for filter rules.
     */
    protected async getFilterRulesBaseUrl(): Promise<string> {
        try {
            const url = await browserStorage.get(this.FILTERS_BASE_URL_KEY);

            if (typeof url !== 'string' || !url) {
                logger.warn('[ext.NetworkSettings.getFilterRulesBaseUrl]: Invalid filter rules base url from storage:', url);
                return this.DEFAULT_FILTER_RULES_BASE_URL;
            }

            return url;
        } catch (error) {
            logger.warn('[ext.NetworkSettings.getFilterRulesBaseUrl]: Failed to get filters base url from storage:', error);
            return this.DEFAULT_FILTER_RULES_BASE_URL;
        }
    }

    /**
     * @inheritdoc
     */
    get filtersUrl(): string {
        if (UserAgent.isFirefox) {
            return `${this.filtersRulesBaseUrl}/firefox`;
        }

        if (UserAgent.isEdge) {
            return `${this.filtersRulesBaseUrl}/edge`;
        }

        if (UserAgent.isOpera) {
            return `${this.filtersRulesBaseUrl}/opera`;
        }

        return `${this.filtersRulesBaseUrl}/chromium`;
    }
}
