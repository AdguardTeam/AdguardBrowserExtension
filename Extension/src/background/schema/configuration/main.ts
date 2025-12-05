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
import zod from 'zod';

import { generalSettingsConfigValidator } from './general-settings';
import { extensionSpecificSettingsConfigValidator } from './extension-specific-settings';
import { filtersConfigValidator } from './filters';
import { stealthConfigValidator } from './stealth';

// Root configuration

export const PROTOCOL_VERSION = '2.0';

export const enum RootOption {
    ProtocolVersion = 'protocol-version',
    GeneralSettings = 'general-settings',
    ExtensionSpecificSettings = 'extension-specific-settings',
    Filters = 'filters',
    Stealth = 'stealth',
}

export const configValidator = zod.object({
    /**
     * Describes the current version of the object. This is necessary to check
     * if we need to migrate from the old settings.
     */
    [RootOption.ProtocolVersion]: zod.literal(PROTOCOL_VERSION),
    /**
     * Contains general application settings: appearance theme, language, time
     * to check for updates to filters and some filtering options.
     */
    [RootOption.GeneralSettings]: generalSettingsConfigValidator,
    /**
     * Contains some additional extension settings and UI settings.
     */
    [RootOption.ExtensionSpecificSettings]: extensionSpecificSettingsConfigValidator,
    /**
     * Contains all information about filters: regular, custom, user filter and
     * allowlist.
     */
    [RootOption.Filters]: filtersConfigValidator,
    /**
     * Contains various secure browsing settings: cookie deletion time, privacy
     * headers, referrer hiding, and the ability to enable additional filters.
     */
    [RootOption.Stealth]: stealthConfigValidator.optional(),
});

/**
 * This is the root object for exported/imported settings, which contains all
 * the information needed to start the application.
 */
export type Config = zod.infer<typeof configValidator>;
