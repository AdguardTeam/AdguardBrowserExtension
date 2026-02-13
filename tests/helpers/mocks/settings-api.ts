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

import { type Mock, vi } from 'vitest';

export class SettingsApi {
    init: Mock = vi.fn();

    setSetting: Mock = vi.fn();

    static getSetting: Mock = vi.fn();

    getData: Mock = vi.fn();

    getTsWebExtConfiguration: Mock = vi.fn();

    reset: Mock = vi.fn();

    import: Mock = vi.fn();

    export: Mock = vi.fn();

    importGeneralSettings: Mock = vi.fn();

    exportGeneralSettings: Mock = vi.fn();

    importExtensionSpecificSettings: Mock = vi.fn();

    exportExtensionSpecificSettings: Mock = vi.fn();

    importFilters: Mock = vi.fn();

    exportFilters: Mock = vi.fn();

    importUserFilter: Mock = vi.fn();

    exportUserFilter: Mock = vi.fn();

    importAllowlist: Mock = vi.fn();

    exportAllowlist: Mock = vi.fn();

    importStealth: Mock = vi.fn();

    exportStealth: Mock = vi.fn();
}
