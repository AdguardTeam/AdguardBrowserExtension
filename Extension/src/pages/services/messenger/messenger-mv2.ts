/* eslint-disable class-methods-use-this */
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
import { type ExtractMessageResponse, MessageType } from '../../../common/messages';

import { MessengerCommon } from './messenger-common';

export class Messenger extends MessengerCommon {
    /**
     * @inheritdoc
     */
    updateFiltersMV2 = async (): Promise<ExtractMessageResponse<MessageType.CheckFiltersUpdate>> => {
        return this.sendMessage(MessageType.CheckFiltersUpdate);
    };

    /**
     * @inheritdoc
     */
    updateExtensionMV3 = async (
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        { from }: any,
    ): Promise<ExtractMessageResponse<MessageType.UpdateExtensionMv3>> => {
        throw new Error('[ext.Messenger.updateExtensionMV3]: extension update is not supported in MV2');
    };
}

export const messenger = new Messenger();
