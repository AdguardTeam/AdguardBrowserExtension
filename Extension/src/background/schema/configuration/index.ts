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
export {
    PROTOCOL_VERSION,
    RootOption,
    configValidator,
    type Config,
} from './main';
export {
    GeneralSettingsOption,
    generalSettingsConfigValidator,
    type GeneralSettingsConfig,
} from './general-settings';
export {
    ExtensionSpecificSettingsOption,
    extensionSpecificSettingsConfigValidator,
    type ExtensionSpecificSettingsConfig,
} from './extension-specific-settings';
export { CustomFilterOption, customFiltersConfigValidator } from './custom-filters';
export { UserFilterOption, userFilterValidator, type UserFilterConfig } from './user-filter';
export { AllowlistOption, allowlistValidator, type AllowlistConfig } from './allowlist';
export { FiltersOption, filtersConfigValidator, type FiltersConfig } from './filters';
export { StealthOption, stealthConfigValidator, type StealthConfig } from './stealth';
