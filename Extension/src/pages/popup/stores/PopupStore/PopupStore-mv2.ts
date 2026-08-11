/**
 * Copyright (c) 2015-2026 Adguard Software Ltd.
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

import { type ExtensionUpdateFSMState } from '../../../../common/constants';

import { PopupStoreCommon } from './PopupStore-common';

export class PopupStore extends PopupStoreCommon {
    /** @inheritdoc */
    override async getPopupData(): Promise<void> {
        await super.getPopupData();
        this.setIsPopupDataReceived(true);
    }

    /**
     * No-op in MV2: extension update FSM state changes are not supported in MV2.
     *
     * @param _state The new FSM state value (unused in MV2).
     */
    // eslint-disable-next-line class-methods-use-this, @typescript-eslint/no-unused-vars
    handleExtensionUpdateStateChange(_state: ExtensionUpdateFSMState): void {
        // MV2 does not use the extension update FSM.
    }
}
