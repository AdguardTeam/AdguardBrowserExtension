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
import { rulesLimitsService } from '../services/rules-limits/rules-limits-service-mv3';
import { ExtensionUpdateService } from '../services/extension-update/extension-update-service-mv3';
import { logger } from '../../common/logger';
import { EXTENSION_INITIALIZED_EVENT } from '../../common/constants';
import { FiltersApi, network } from '../api';

import { AppCommon } from './app-common';

/**
 * This class is app entry point.
 *
 * {@link App.init} Initializes all app services
 * and handle webextension API events for first install and update scenario.
 */
export class App extends AppCommon {
    /**
     * @inheritdoc
     */
    public static override async init(): Promise<boolean> {
        const isUpdate = await AppCommon.init();

        await ExtensionUpdateService.handleExtensionReloadOnUpdate(isUpdate);

        // This event is used for integration tests (scripts/browser-test/index.ts)
        // and waitUntilExtensionInitialized() is adding a listener to the event
        // so the event should be dispatched eventually after all initialization
        // is done.
        dispatchEvent(new Event(EXTENSION_INITIALIZED_EVENT));

        return isUpdate;
    }

    /**
     * @inheritdoc
     */
    protected static override async initFiltersApi(isInstall: boolean, isUpdate: boolean): Promise<void> {
        // Initializes network settings.
        await network.init();

        /**
         * Initializes Filters data:
         * - Loads app i18n metadata and caches it in i18n-metadata storage
         * - Loads app metadata, apply localization from i18n-metadata storage and caches it in metadata storage
         * - Initializes storages for userrules, allowlist, custom filters metadata and page-stats
         * - Initializes storages for filters state, groups state and filters versions, based on app metadata.
         *
         * Need to be call after network.init.
         */
        await FiltersApi.init(isInstall);

        // Update the filters in the MV3 version for each extension update,
        // even for patches, because MV3 does not support remote filter updates
        // (either full or through diffs) and filters are updated only with
        // the update of the entire extension.
        if (isUpdate) {
            const filtersIds = await FiltersApi.reloadFiltersFromLocal();
            logger.info('[ext.App.initFiltersApi]: following filters has been updated from local resources:', filtersIds);
        }

        // need to be call after FiltersApi
        await rulesLimitsService.init();
    }

    /**
     * @inheritdoc
     */
    protected static override async manifestSpecificInit(): Promise<void> {
        await ExtensionUpdateService.init();
    }
}
