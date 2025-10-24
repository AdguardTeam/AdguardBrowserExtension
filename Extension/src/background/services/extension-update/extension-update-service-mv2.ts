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

import { NotImplementedError } from '../../errors/not-implemented-error';

import { type ManualExtensionUpdateData } from './types';

/**
 * This service is a empty dummy to correct work of MV2 build without
 * using MV3 code.
 */
export class ExtensionUpdateService {
    /**
     * Just a empty dummy method for MV2.
     * TODO: remove this method after split Extension/src/background/services/ui/popup.ts for mv2/mv3 versions.
     *
     * @throws Not implemented error.
     */
    // eslint-disable-next-line class-methods-use-this
    public static get isUpdateAvailable(): boolean {
        throw new NotImplementedError();
    }

    /**
     * Just a empty dummy method for MV2.
     * TODO: remove this method after split Extension/src/background/services/ui/popup.ts for mv2/mv3 versions.
     *
     * @throws Not implemented error.
     */
    public static async getManualExtensionUpdateData(): Promise<ManualExtensionUpdateData | null> {
        throw new NotImplementedError();
    }
}
