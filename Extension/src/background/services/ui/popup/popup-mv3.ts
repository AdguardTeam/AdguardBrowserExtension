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

import { RulesLimitsService } from 'rules-limits-service';

import { ExtensionUpdateService } from '../../extension-update/extension-update-service-mv3';
import { ExtensionUpdateFSMEvent } from '../../../../common/constants';
import { MessageType } from '../../../../common/messages';
import { messageHandler } from '../../../message-handler';
import { extensionUpdateActor } from '../../extension-update/extension-update-machine-mv3';

import { PopupServiceCommon } from './popup-common';

/**
 * Response type for getting extension status information specific to Manifest V3 popup.
 * Contains extension update status and filter limits information.
 */
export type GetExtensionStatusForPopupResponse = {
    /**
     * Whether the rule limits are exceeded
     * and browser changed the list of enabled filters.
     */
    areFilterLimitsExceeded: boolean;

    /**
     * Whether the extension update is available after the checking.
     */
    isExtensionUpdateAvailable: boolean;

    /**
     * Whether the extension was reloaded after update.
     */
    isExtensionReloadedOnUpdate: boolean;

    /**
     * Whether the extension update was successful.
     */
    isSuccessfulExtensionUpdate: boolean;
};

/**
 * Handles work with popups.
 */
export class PopupService extends PopupServiceCommon {
    /** @inheritdoc */
    static init(): void {
        PopupServiceCommon.init();
        messageHandler.addListener(
            MessageType.GetExtensionStatusForPopupMV3,
            PopupService.getExtensionStatusForPopupMV3,
        );
    }

    /**
     * Returns extension status for MV3 popup.
     *
     * @returns Extension status including update info and filter limits.
     */
    static async getExtensionStatusForPopupMV3(): Promise<GetExtensionStatusForPopupResponse> {
        const isExtensionUpdateAvailable = ExtensionUpdateService.isUpdateAvailable;
        const manualExtensionUpdateData = await ExtensionUpdateService.getManualExtensionUpdateData();
        const isExtensionReloadedOnUpdate = manualExtensionUpdateData !== null;
        const isSuccessfulExtensionUpdate = manualExtensionUpdateData?.isOk || false;
        const areFilterLimitsExceeded = await RulesLimitsService.areFilterLimitsExceeded();

        extensionUpdateActor.send({
            type: ExtensionUpdateFSMEvent.Init,
            isReloadedOnUpdate: isExtensionReloadedOnUpdate,
            isUpdateAvailable: isExtensionUpdateAvailable,
        });

        return {
            areFilterLimitsExceeded,
            isExtensionUpdateAvailable,
            isExtensionReloadedOnUpdate,
            isSuccessfulExtensionUpdate,
        };
    }
}
