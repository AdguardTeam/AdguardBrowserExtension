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
import { type GetExtensionStatusForPopupResponse } from 'popup-service';

import {
    type ExtractMessageResponse,
    MessageType,
    type UpdateExtensionMessageMv3,
} from '../../../common/messages';

import { MessengerCommon } from './messenger-common';

export class Messenger extends MessengerCommon {
    // eslint-disable-next-line class-methods-use-this
    async updateFiltersMV2(): Promise<ExtractMessageResponse<MessageType.CheckFiltersUpdate>> {
        throw new Error('[ext.Messenger.updateFiltersMV2]: filters update is not supported in MV3');
    }

    /**
     * @inheritdoc
     */
    async checkUpdatesMV3(): Promise<ExtractMessageResponse<MessageType.CheckExtensionUpdateMv3>> {
        return this.sendMessage(MessageType.CheckExtensionUpdateMv3);
    }

    /**
     * @inheritdoc
     */
    async updateExtensionMV3(
        { from }: UpdateExtensionMessageMv3['data'],
    ): Promise<ExtractMessageResponse<MessageType.UpdateExtensionMv3>> {
        return this.sendMessage(MessageType.UpdateExtensionMv3, { from });
    }

    /**
     * Sends a message to the background page to get extension status for MV3 popup.
     *
     * @returns Promise that resolves with extension status
     */
    async getExtensionStatusForPopupMV3(): Promise<GetExtensionStatusForPopupResponse> {
        return this.sendMessage(MessageType.GetExtensionStatusForPopupMV3);
    }
}

export const messenger = new Messenger();
