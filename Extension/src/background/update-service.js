/**
 * This file is part of Adguard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * Adguard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Adguard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Adguard Browser Extension. If not, see <http://www.gnu.org/licenses/>.
 */

import * as TSUrlFilter from '@adguard/tsurlfilter';
import { backgroundPage } from './extension-api/background-page';
import { log } from '../common/log';
import { browserUtils } from './utils/browser-utils';
import { filtersState } from './filter/filters/filters-state';
import { subscriptions } from './filter/filters/subscription';
import { rulesStorage } from './storage';
import { application } from './application';
import { settings } from './settings/user-settings';
import { safebrowsing } from './filter/services/safebrowsing';
import { utils } from './utils/common';
import { settingsProvider } from './settings/settings-provider';
import { notifications } from './utils/notifications';

/**
 * Service that manages extension version information and handles
 * extension update. For instance we may need to change storage schema on update.
 */
export const applicationUpdateService = (function () {
    /**
     * Helper to execute promises one by one
     *
     * @param methods Methods to execute
     * @private
     */
    async function executeMethods(methods) {
        try {
            // eslint-disable-next-line no-restricted-syntax
            for (const method of methods) {
                // eslint-disable-next-line no-await-in-loop
                await method();
            }
        } catch (e) {
            // if catch error while updating, reset settings and reload extension
            await settingsProvider.applyDefaultSettings();
            backgroundPage.runtime.reload();
        }
    }

    function handleUndefinedGroupStatuses() {
        const filters = subscriptions.getFilters();

        const filtersStateInfo = filtersState.getFiltersState();

        const enabledFilters = filters.filter((filter) => {
            const { filterId } = filter;
            return !!(filtersStateInfo[filterId] && filtersStateInfo[filterId].enabled);
        });

        const groupState = filtersState.getGroupsState();

        enabledFilters.forEach((filter) => {
            const { groupId } = filter;
            if (typeof groupState[groupId] === 'undefined') {
                application.enableGroup(filter.groupId);
            }
        });
    }

    function handleDefaultUpdatePeriodSetting() {
        const previousDefaultValue = 48 * 60 * 60 * 1000;

        const currentUpdatePeriod = settings.getFiltersUpdatePeriod();

        if (currentUpdatePeriod === previousDefaultValue) {
            settings.setFiltersUpdatePeriod(settings.DEFAULT_FILTERS_UPDATE_PERIOD);
        }
    }

    function clearCaches() {
        safebrowsing.clearCache();
    }

    /**
     * From that version we store already converted rule texts in storage
     */
    async function onUpdateRuleConverter() {
        const filtersStateInfo = filtersState.getFiltersState();
        const installedFiltersIds = Object.keys(filtersStateInfo)
            .map(filterId => Number.parseInt(filterId, 10));

        const reloadRulesPromises = installedFiltersIds.map(async (filterId) => {
            if (filterId === utils.filters.USER_FILTER_ID) {
                return;
            }

            let loadedRulesText = await rulesStorage.read(filterId);
            if (!loadedRulesText) {
                loadedRulesText = [];
            }

            log.info('Reloading and converting {0} rules for filter {1}', loadedRulesText.length, filterId);
            const converted = TSUrlFilter.RuleConverter.convertRules(loadedRulesText.join('\n')).split('\n');

            log.debug('Saving {0} rules to filter {1}', converted.length, filterId);
            await rulesStorage.write(filterId, converted);
        });

        await Promise.all(reloadRulesPromises);
    }

    /**
     * In the v4.0.171 we have littered window.localStorage with proms used in the promo notifications module, now we
     * are clearing them
     */
    function onUpdateClearPromoDetails() {
        window.localStorage.removeItem(notifications.VIEWED_NOTIFICATIONS);
        window.localStorage.removeItem(notifications.LAST_NOTIFICATION_TIME);
    }

    /**
     * Function removes obsolete filters from the storage
     * @returns {Promise<any>}
     */
    async function handleObsoleteFiltersRemoval() {
        const filtersStateInfo = filtersState.getFiltersState();
        const allFiltersMetadata = subscriptions.getFilters();

        const installedFiltersIds = Object.keys(filtersStateInfo)
            .map(filterId => Number.parseInt(filterId, 10));

        const existingFiltersIds = installedFiltersIds.filter((filterId) => {
            return allFiltersMetadata.find(f => f.filterId === filterId);
        });

        const filtersIdsToRemove = installedFiltersIds.filter((id) => {
            return !existingFiltersIds.includes(id);
        });

        filtersIdsToRemove.forEach(filterId => filtersState.removeFilter(filterId));

        const removePromises = filtersIdsToRemove.map(async (filterId) => {
            await rulesStorage.remove(filterId);
            log.info(`Filter with id: ${filterId} removed from the storage`);
        });

        await Promise.all(removePromises);
    }

    /**
     * Async returns extension run info
     *
     * {{isFirstRun: boolean, isUpdate: (boolean|*), currentVersion: (Prefs.version|*), prevVersion: *}}
     */
    const getRunInfo = function () {
        const prevVersion = browserUtils.getAppVersion();
        const currentVersion = backgroundPage.app.getVersion();
        browserUtils.setAppVersion(currentVersion);

        const isFirstRun = (currentVersion !== prevVersion && !prevVersion);
        const isUpdate = !!(currentVersion !== prevVersion && prevVersion);

        return ({
            isFirstRun,
            isUpdate,
            currentVersion,
            prevVersion,
        });
    };

    /**
     * Handle extension update
     * @param runInfo   Run info
     */
    const onUpdate = async function (runInfo) {
        const methods = [];

        log.info(`The extension was updated from ${runInfo.prevVersion}`);

        if (browserUtils.isGreaterVersion('3.0.3', runInfo.prevVersion)) {
            methods.push(handleUndefinedGroupStatuses);
        }
        if (browserUtils.isGreaterVersion('3.3.5', runInfo.prevVersion)) {
            methods.push(handleDefaultUpdatePeriodSetting);
        }
        if (browserUtils.isGreaterVersion('4.0.67', runInfo.prevVersion)) {
            methods.push(onUpdateRuleConverter);
        }
        if (browserUtils.isGreaterVersion('4.0.180', runInfo.prevVersion)) {
            methods.push(onUpdateClearPromoDetails);
        }

        // On every update remove if necessary obsolete filters
        methods.push(handleObsoleteFiltersRemoval);
        // On every update clear persisted caches
        methods.push(clearCaches);

        await executeMethods(methods);
    };

    return {
        getRunInfo,
        onUpdate,
    };
})();
