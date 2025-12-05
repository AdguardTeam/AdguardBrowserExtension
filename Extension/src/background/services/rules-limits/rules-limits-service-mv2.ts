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

/**
 * TODO: remove this MV2 implimentation after split Extension/src/background/services/ui/popup.ts for mv2/mv3 versions.
 * This service is a empty dummy to correct work of MV2 build without
 * using MV3 code.
 */
export class RulesLimitsService {
    /**
     * Just a empty dummy method for MV2.
     *
     * @throws Not implemented error.
     */
    public static areFilterLimitsExceeded(): boolean {
        throw new NotImplementedError();
    }
}
