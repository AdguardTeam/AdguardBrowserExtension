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
import { logger } from '../../../../common/logger';

import { PopupStoreCommon } from './PopupStore-common';

export class PopupStore extends PopupStoreCommon {
    /**
     * Checks for updates - not supported in MV2.
     *
     * @throws {Error} Always throws an error indicating that the method is not implemented.
     */
    // eslint-disable-next-line class-methods-use-this
    checkUpdates(): void {
        throw new Error('Method not implemented.');
    }

    /**
     * Configures extension-specific update options - not supported in MV2.
     *
     * Extension updates are only available in MV3 version.
     * This method exists for interface compatibility but does nothing.
     */
    // eslint-disable-next-line class-methods-use-this
    protected configureExtensionUpdates(): void {
        logger.debug('[ext.PopupStore.configureExtensionUpdates]: extension updates are not supported in MV2');
    }
}
