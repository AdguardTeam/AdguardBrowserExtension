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

import { ConfigurationExportApi } from './configuration-export-api';

export { ConfigurationExportApi } from './configuration-export-api';

/**
 * MV3 concrete implementation of {@link ConfigurationExportApi}.
 * Browsing security and cookie self-destruct TTLs are not available on MV3,
 * so the corresponding collection methods are no-ops.
 */
export class ConfigurationExportApiMv3 extends ConfigurationExportApi {
    /**
     * No-op on MV3 — browsing security is not available.
     */
    // eslint-disable-next-line class-methods-use-this
    protected override collectBrowsingSecurityParams(): void {
        // Browsing security is not supported on MV3.
    }

    /**
     * No-op on MV3 — cookie self-destruct TTLs are not available.
     */
    // eslint-disable-next-line class-methods-use-this
    protected override collectCookieParams(): void {
        // Cookie self-destruct is not supported on MV3.
    }
}

export const configurationExportApi = new ConfigurationExportApiMv3();
