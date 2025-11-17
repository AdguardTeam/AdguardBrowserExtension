/**
 * Copyright (c) 2015-2025 Adguard Software Ltd.
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

import { NotImplementedError } from '../../errors/not-implemented-error';

import { type ManualUpdateMetadata } from './types';

/**
 * This service is a empty dummy to correct work of MV2 build without
 * using MV3 code.
 */
export class ExtensionUpdateService {
    /**
     * Just a empty dummy method for MV2.
     */
    // eslint-disable-next-line @typescript-eslint/no-useless-constructor, @typescript-eslint/no-empty-function
    constructor() { }

    /**
     * Just a empty dummy method for MV2.
     */
    // eslint-disable-next-line class-methods-use-this
    public static init(): void { }

    /**
     * Just a empty dummy method for MV2.
     *
     * @throws Not implemented error.
     */
    // eslint-disable-next-line class-methods-use-this
    async manualUpdateExtension(): Promise<boolean> {
        throw new NotImplementedError();
    }

    /**
     * Just a empty dummy method for MV2.
     *
     * @param isUpdate Whether the extension version was updated.
     *
     * @throws Not implemented error.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public static async handleExtensionReloadOnUpdate(isUpdate: boolean): Promise<void> {
        throw new NotImplementedError();
    }

    /**
     * Just a empty dummy method for MV2.
     *
     * @throws Not implemented error.
     */
    // eslint-disable-next-line class-methods-use-this
    public static get isUpdateAvailable(): boolean {
        throw new NotImplementedError();
    }

    /**
     * Just a empty dummy method for MV2.
     *
     * @throws Not implemented error.
     */
    public static async getManualExtensionUpdateData(): Promise<ManualUpdateMetadata | null> {
        throw new NotImplementedError();
    }

    /**
     * Just a empty dummy method for MV2.
     *
     * @throws Not implemented error.
     */
    public static shouldShowUpdateIcon(): boolean {
        throw new NotImplementedError();
    }
}
