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

import { NotifierType } from '../../../common/constants';
import { MessageType } from '../../../common/messages';
import { sleepIfNecessary } from '../../../common/sleep-utils';
import { MIN_UPDATE_DISPLAY_DURATION_MS } from '../../../pages/common/constants';
import { iconsApi } from '../../api';
import { messageHandler } from '../../message-handler';
import { notifier } from '../../notifier';

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
     * FIXME: add docs.
     *
     * @returns FIXME: ...
     */
    private async manualCheckExtensionUpdate(): Promise<boolean> {
        const start = Date.now();

        // FIXME: implement the logic for isUpdateAvailable.
        this.isUpdateAvailable = true;

        await sleepIfNecessary(start, MIN_UPDATE_DISPLAY_DURATION_MS);

        if (this.isUpdateAvailable) {
            iconsApi.update();
            notifier.notifyListeners(NotifierType.ExtensionUpdateIsAvailable);
        }

        return Promise.resolve(this.isUpdateAvailable);
    }

    /**
     * FIXME: add docs.
     *
     * @returns FIXME: ...
     */
    private async manualUpdateExtension(): Promise<boolean> {
        const start = Date.now();

        // FIXME: implement the logic for isExtensionUpdated.
        this.isExtensionUpdated = false;
        this.isUpdateAvailable = false;

        await sleepIfNecessary(start, MIN_UPDATE_DISPLAY_DURATION_MS);

        iconsApi.update();

        return Promise.resolve(this.isExtensionUpdated);
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
