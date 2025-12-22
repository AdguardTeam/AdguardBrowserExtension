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
import { type SettingsConfig } from 'tswebextension';

import { logger } from '../../../common/logger';
import { type StealthConfig } from '../../schema';
import { CommonFilterApi } from '../filters';
import { GPC_SCRIPT_OUTPUT, HIDE_DOCUMENT_REFERRER_OUTPUT } from '../../../../../constants';

import { SettingsApiCommon } from './settings-common';

/**
 * SettingsApi is a facade class for encapsulating the work with extension
 * settings: getting, installing, gathering tswebextension configuration from
 * current settings, importing and exporting.
 */
export class SettingsApi extends SettingsApiCommon {
    /**
     * Collects {@link SettingsConfig} for tswebextension from current extension settings.
     *
     * @returns Collected {@link SettingsConfig} for tswebextension.
     */
    public static getTsWebExtConfiguration(): SettingsConfig {
        const commonConfig = SettingsApiCommon.getCommonTsWebExtConfiguration();

        return {
            ...commonConfig,
            gpcScriptUrl: `/${GPC_SCRIPT_OUTPUT}.js`,
            hideDocumentReferrerScriptUrl: `/${HIDE_DOCUMENT_REFERRER_OUTPUT}.js`,
            debugScriptlets: false,
            stealth: {
                ...commonConfig.stealth,
                // TODO: revert when will be found a better way to add exclusions for $stealth=referrer
                // AG-34765 TODO: check task
                // Setting to false so that it will remove already added session rules.
                hideReferrer: false,
                // TODO: revert when will be found a better way to add exclusions for $stealth=searchqueries
                hideSearchQueries: false,
            },
        };
    }

    /**
     * Loads built-in filters and enables them.
     *
     * Checks whether the filter is supported by MV3.
     * Tries to load them from the storage only.
     *
     * @param builtInFilters Array of built-in filters ids.
     */
    protected static override async loadBuiltInFilters(builtInFilters: number[]): Promise<void> {
        const filtersToLoad: number[] = [];

        builtInFilters.forEach((filterId) => {
            if (CommonFilterApi.isFilterSupported(filterId)) {
                filtersToLoad.push(filterId);
            } else {
                logger.debug(`[ext.SettingsApi.loadBuiltInFilters]: MV3 extension does not support filter with id ${filterId}`);
            }
        });

        await SettingsApi.loadBuiltInFiltersLocal(filtersToLoad);
    }

    /**
     * @inheritdoc
     */
    protected static override async importStealth(stealthConfig: StealthConfig): Promise<void> {
        await SettingsApiCommon.importStealth(stealthConfig, false);
    }
}
