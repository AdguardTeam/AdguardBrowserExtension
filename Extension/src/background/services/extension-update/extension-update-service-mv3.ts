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

import { ExtensionsIds } from '../../../../../constants';
import { MANUAL_EXTENSION_UPDATE_KEY, ManualExtensionUpdatePage } from '../../../common/constants';
import { logger } from '../../../common/logger';
import { MessageType, type UpdateExtensionMessage } from '../../../common/messages';
import { sleepIfNecessary } from '../../../common/sleep-utils';
import { getCrxUrl } from '../../../common/update-mv3';
import { MIN_UPDATE_DISPLAY_DURATION_MS } from '../../../pages/common/constants';
import {
    browserAction,
    iconsApi,
    PagesApi,
} from '../../api';
import { messageHandler } from '../../message-handler';
import { browserStorage } from '../../storages';
// import { Prefs } from '../../prefs';
// import { getRunInfo, Version } from '../../utils';
import { getRunInfo } from '../../utils';

import { type ManualExtensionUpdateData } from './types';

/**
 * Service for checking and updating the extension.
 *
 * Needed for MV3.
 */
export class ExtensionUpdateService {
    /**
     * Flag indicating if an update is available.
     */
    private isUpdateAvailable: boolean = false;

    // FIXME: check if needed
    /**
     * Flag indicating if the extension has been updated.
     */
    private isExtensionUpdated: boolean = false;

    /**
     * Constructor.
     *
     * Binds event handlers.
     */
    constructor() {
        this.manualCheckExtensionUpdate = this.manualCheckExtensionUpdate.bind(this);
        this.manualUpdateExtension = this.manualUpdateExtension.bind(this);
    }

    /**
     * Initializes the service.
     */
    public init(): void {
        messageHandler.addListener(MessageType.CheckExtensionUpdate, this.manualCheckExtensionUpdate);
        messageHandler.addListener(MessageType.UpdateExtension, this.manualUpdateExtension);
    }

    /**
     * Checks for extension updates.
     *
     * @returns True if update is available, false otherwise.
     */
    private async manualCheckExtensionUpdate(): Promise<boolean> {
        const start = Date.now();

        // FIXME: use chrome.runtime.requestUpdateCheck() to check updates after fetching via the update cws url
        // because new extension version may not be loaded on the computer yet
        const latestChromeStoreVersion = await ExtensionUpdateService.getLatestChromeStoreVersion();
        if (!latestChromeStoreVersion) {
            return false;
        }

        const { currentAppVersion } = await getRunInfo();

        // const currentVersion = new Version(currentAppVersion);
        // const latestVersion = new Version(latestChromeStoreVersion);
        // this.isUpdateAvailable = latestVersion.compare(currentVersion) > 0;
        // FIXME: remove as needed only for development
        this.isUpdateAvailable = true;

        /**
         * Minimal duration is needed for more smooth UI.
         */
        await sleepIfNecessary(start, MIN_UPDATE_DISPLAY_DURATION_MS);

        if (this.isUpdateAvailable) {
            iconsApi.update();
            logger.debug(`[ext.ExtensionUpdateService.manualCheckExtensionUpdate]: Current version ${currentAppVersion} is lower than latest available version ${latestChromeStoreVersion}`);
        } else {
            logger.debug(`[ext.ExtensionUpdateService.manualCheckExtensionUpdate]: Current version ${currentAppVersion} is higher than latest available version ${latestChromeStoreVersion}`);
        }

        return this.isUpdateAvailable;
    }

    /**
     * Updates the extension.
     *
     * @param message Message of type {@link UpdateExtensionMessage}.
     * @param message.data Contains page from which the update was triggered.
     *
     * @returns False if update fails,
     * otherwise void because the extension reloads.
     */
    private async manualUpdateExtension({ data }: UpdateExtensionMessage): Promise<boolean | void> {
        const start = Date.now();

        const { fromPage } = data;

        // change the state of isUpdateAvailable for a case when the updating fails
        this.isUpdateAvailable = false;
        this.isExtensionUpdated = false;

        iconsApi.update();

        try {
            const { currentAppVersion } = await getRunInfo();
            const manualExtensionDataToSave: ManualExtensionUpdateData = {
                initVersion: currentAppVersion,
                pageToOpenAfterReload: fromPage,
            };
            this.isExtensionUpdated = true;
            // IMPORTANT: saving to storage should be done before the extension reload
            await browserStorage.set(MANUAL_EXTENSION_UPDATE_KEY, JSON.stringify(manualExtensionDataToSave));

            /**
             * Minimal duration is needed for more smooth UI.
             *
             * Being used for:
             * - notification showing on popup;
             * - updating status on options page before the extension reload.
             */
            await sleepIfNecessary(start, MIN_UPDATE_DISPLAY_DURATION_MS);

            ExtensionUpdateService.reloadExtension();
        } catch (e) {
            await browserStorage.remove(MANUAL_EXTENSION_UPDATE_KEY);
            this.isExtensionUpdated = false;
            logger.error(`[ext.ExtensionUpdateService.manualUpdateExtension]: Failed to reload extension: ${e}`);
        }

        return this.isExtensionUpdated;
    }

    /**
     * Reloads the extension.
     *
     * IMPORTANT:
     * `chrome.runtime.reload` should be used,
     * otherwise service worker may be inactive after reload
     * if `browser.runtime.reload` from webextension-polyfill is used.
     */
    private static reloadExtension(): void {
        chrome.runtime.reload();
    }

    /**
     * Retrieves manual extension update data from storage.
     *
     * @returns Manual extension update data or null if not found.
     */
    private static async retrieveManualExtensionUpdateData(): Promise<ManualExtensionUpdateData | null> {
        const manualExtensionUpdateStr = await browserStorage.get(MANUAL_EXTENSION_UPDATE_KEY);

        if (typeof manualExtensionUpdateStr !== 'string') {
            return null;
        }

        try {
            return JSON.parse(manualExtensionUpdateStr);
        } catch (e) {
            return null;
        }
    }

    /**
     * Handles extension reload after update.
     */
    public static async handleExtensionReloadOnUpdate(): Promise<void> {
        const manualExtensionUpdateData = await ExtensionUpdateService.retrieveManualExtensionUpdateData();

        if (!manualExtensionUpdateData) {
            logger.debug('[ext.ExtensionUpdateService.handleExtensionReloadOnUpdate]: No manual extension update data found');
            return;
        }

        const { initVersion, pageToOpenAfterReload } = manualExtensionUpdateData;

        logger.info(`[ext.ExtensionUpdateService.handleExtensionReloadOnUpdate]: The extension was updated from ${initVersion}`);

        if (!pageToOpenAfterReload) {
            logger.warn('[ext.ExtensionUpdateService.handleExtensionReloadOnUpdate]: No pageToOpenAfterReload found');
            await browserStorage.remove(MANUAL_EXTENSION_UPDATE_KEY);
            return;
        }

        if (pageToOpenAfterReload === ManualExtensionUpdatePage.Options) {
            logger.info('[ext.ExtensionUpdateService.handleExtensionReloadOnUpdate]: Opening options page...');
            await PagesApi.openFiltersOnSettingsPage();
        } else if (pageToOpenAfterReload === ManualExtensionUpdatePage.Popup) {
            logger.info('[ext.ExtensionUpdateService.handleExtensionReloadOnUpdate]: Opening popup...');
            await browserAction.openPopup();
        }
    }

    /**
     * Returns the latest version of the extension available in the Chrome Web Store.
     *
     * @returns Extension version available in the Chrome Web Store.
     *
     * @throws Error if fetching the version fails.
     */
    private static async getLatestChromeStoreVersion(): Promise<string | null> {
        // FIXME: revert before merge
        // const extensionId = Prefs.id;
        const extensionId = 'apjcbfpjihpedihablmalmbbhjpklbdf';

        const possibleExtensionIds = Object.values(ExtensionsIds).filter((id) => !!id);

        if (!possibleExtensionIds.includes(extensionId)) {
            logger.error(`[ext.ExtensionUpdateService.getLatestChromeStoreVersion]: Invalid extension ID: '${extensionId}'`);
            return null;
        }

        const updateUrl = getCrxUrl(extensionId);

        logger.debug(`[ext.ExtensionUpdateService.getLatestChromeStoreVersion]: Checking for updates at ${updateUrl}...`);

        const response = await fetch(updateUrl);

        if (response.status !== 200) {
            logger.debug(`[ext.ExtensionUpdateService.getLatestChromeStoreVersion]: No update found for "${updateUrl}", status: ${response.status}`);
            return null;
        }

        const latestVersionUrl = response.url;

        if (!latestVersionUrl) {
            logger.debug(`[ext.ExtensionUpdateService.getLatestChromeStoreVersion]: No redirect location header found for "${extensionId}"`);
            return null;
        }

        const match = latestVersionUrl.match(/_([0-9_]+)\.crx$/);

        if (!match || !match[1]) {
            logger.debug('[ext.ExtensionUpdateService.getLatestChromeStoreVersion]: Could not parse version from redirect URL.');
            return null;
        }

        const latestExtensionVersionInStore = match[1]
            // '5_1_111_0' -> '5.1.111.0'
            .replace(/_/g, '.')
            // '5.1.111.0' -> '5.1.111'
            .replace(/\.0$/g, '');

        return latestExtensionVersionInStore;
    }

    /**
     * Returns boolean value indicating if extension update is available.
     *
     * @returns True if update is available, false otherwise.
     */
    public getIsUpdateAvailable(): boolean {
        return this.isUpdateAvailable;
    }

    /**
     * Returns boolean value indicating if extension update was done manually previously.
     *
     * IMPORTANT!
     * After retrieving the value from the storage, it is removed.
     *
     * @returns True if extension was updated and reloaded previously, false otherwise.
     */
    public static async getIsExtensionReloadedOnUpdate(): Promise<boolean> {
        const manualExtensionUpdateData = await ExtensionUpdateService.retrieveManualExtensionUpdateData();

        await browserStorage.remove(MANUAL_EXTENSION_UPDATE_KEY);

        return !!manualExtensionUpdateData;
    }
}

export const extensionUpdateService = new ExtensionUpdateService();
