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
import { logger } from '../../../common/logger';
import { MessageType } from '../../../common/messages';
import { sleepIfNecessary } from '../../../common/sleep-utils';
import { getCrxUrl } from '../../../common/update-mv3';
import { MIN_UPDATE_DISPLAY_DURATION_MS } from '../../../pages/common/constants';
import {
    extensionUpdateActor,
    ExtensionUpdateEvent,
} from '../../../pages/common/state-machines/extension-update-machine';
import { iconsApi } from '../../api';
import { messageHandler } from '../../message-handler';
import { getRunInfo, Version } from '../../utils';

/**
 * FIXME: add description.
 */
class ExtensionUpdateService {
    /**
     * FIXME: add docs.
     */
    private isUpdateAvailable: boolean = false;

    private isExtensionUpdated: boolean = false;

    /**
     * FIXME: add docs.
     */
    constructor() {
        this.manualCheckExtensionUpdate = this.manualCheckExtensionUpdate.bind(this);
        this.manualUpdateExtension = this.manualUpdateExtension.bind(this);
    }

    /**
     * FIXME: add docs.
     */
    init(): void {
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

        const latestChromeStoreVersion = await ExtensionUpdateService.getLatestChromeStoreVersion();
        if (!latestChromeStoreVersion) {
            return false;
        }

        const { currentAppVersion } = await getRunInfo();

        const currentVersion = new Version(currentAppVersion);
        const latestVersion = new Version(latestChromeStoreVersion);

        this.isUpdateAvailable = latestVersion.compare(currentVersion) > 0;

        await sleepIfNecessary(start, MIN_UPDATE_DISPLAY_DURATION_MS);

        if (this.isUpdateAvailable) {
            iconsApi.update();
        }

        return this.isUpdateAvailable;
    }

    /**
     * Updates the extension.
     *
     * @returns True if update was successful, false otherwise.
     */
    private async manualUpdateExtension(): Promise<boolean> {
        const start = Date.now();

        // change the state of isUpdateAvailable just in case if the update fails
        // FIXME: currently the extension icon relies on this flag,
        // check if it can rely on the state machine
        this.isUpdateAvailable = false;
        this.isExtensionUpdated = false;

        await sleepIfNecessary(start, MIN_UPDATE_DISPLAY_DURATION_MS);

        iconsApi.update();

        if (this.isExtensionUpdated) {
            extensionUpdateActor.send({ type: ExtensionUpdateEvent.UpdateSuccess });
            // FIXME: reload extension to update it
        } else {
            extensionUpdateActor.send({ type: ExtensionUpdateEvent.UpdateFailed });
        }

        return this.isExtensionUpdated;
    }

    /**
     * Returns the latest version of the extension available in the Chrome Web Store.
     *
     * @returns Extension version available in the Chrome Web Store.
     */
    private static async getLatestChromeStoreVersion(): Promise<string | null> {
        // FIXME: check proper id
        const extensionId = ExtensionsIds.release;

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

        logger.debug(`[ext.ExtensionUpdateService.getLatestChromeStoreVersion]: Latest extension version is ${latestVersionUrl}`);

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
}

export const extensionUpdateService = new ExtensionUpdateService();
