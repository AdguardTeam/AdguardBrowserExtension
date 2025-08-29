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

import zod from 'zod';

import { ManualExtensionUpdatePage } from '../../../common/constants';

/**
 * Manual extension update data validator.
 */
export const ManualExtensionUpdateDataValidator = zod.object({
    /**
     * Version of the extension where the manual extension update was initialized.
     */
    initVersion: zod.string(),

    /**
     * Page to open after the extension reloads.
     */
    pageToOpenAfterReload: zod.enum([ManualExtensionUpdatePage.Popup, ManualExtensionUpdatePage.Options]),

    /**
     * Whether the extension update was successful.
     */
    isOk: zod.boolean(),
});

/**
 * Manual extension update data.
 */
export type ManualExtensionUpdateData = zod.infer<typeof ManualExtensionUpdateDataValidator>;
