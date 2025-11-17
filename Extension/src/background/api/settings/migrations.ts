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

import { Unknown } from '../../../common/unknown';
import { StealthOption } from '../../schema';

/**
 * Migration type describes which action should apply to settings
 * when migration from version 'from' to version 'to'.
 */
type Migration = {
    from: string;
    to: string;
    action: (settings: unknown) => Promise<unknown>;
};

/**
 * SettingsMigrations stores migrations to apply to an outdated flat settings
 * object when imported settings from JSON.
 */
export class SettingsMigrations {
    /**
     * Stores migrations with according versions.
     */
    private static settingsMigrationMap: Migration[] = [
        { from: '1.0', to: '2.0', action: this.migrateFromV1_0toV2_0 },
    ];

    /**
     * Migrates settings from any outdated version and returns settings of the latest version.
     *
     * @param protocolVersion Protocol version of provided JSON settings.
     * @param settings JSON settings with outdated version.
     *
     * @returns JSON settings of the latest version.
     *
     * @throws Error when not found migration for current version or
     * not found action for migrate.
     */
    public static async migrateSettings(protocolVersion: string, settings: unknown): Promise<unknown> {
        // Create copy to not modify arg value
        let settingsCopy = JSON.parse(JSON.stringify(settings)) as unknown;

        const migrations = this.settingsMigrationMap;

        let currentMigrationIdx = migrations.findIndex((migration) => {
            return migration.from === protocolVersion;
        });

        if (currentMigrationIdx === -1) {
            throw new Error(`Not found migration for version: ${protocolVersion}`);
        }

        for (currentMigrationIdx; currentMigrationIdx < migrations.length; currentMigrationIdx += 1) {
            const action = migrations[currentMigrationIdx]?.action;
            if (!action) {
                throw new Error(`Not found migration action for migration idx: ${currentMigrationIdx}`);
            }
            // eslint-disable-next-line no-await-in-loop
            settingsCopy = await action(settingsCopy);
        }

        return settingsCopy;
    }

    /**
     * Migrates settings from version 1.0 to version 2.0.
     *
     * @param settings JSON settings with version 1.0.
     *
     * @returns JSON settings of version 2.0.
     *
     * @throws Error when not found field 'filters.whitelist' to rename it.
     */
    private static async migrateFromV1_0toV2_0(settings: unknown): Promise<unknown> {
        if (!settings
            || !Unknown.hasProp(settings, 'filters')
            || !Unknown.hasProp(settings.filters, 'whitelist')
            || !Unknown.hasProp(settings.filters, 'custom-filters')
            || !Unknown.hasProp(settings, 'stealth')
            || !Unknown.hasProp(settings.stealth, 'stealth_disable_stealth_mode')
            || !Unknown.hasProp(settings.stealth, 'stealth-block-first-party-cookies-time')
            || !Unknown.hasProp(settings.stealth, 'stealth-block-third-party-cookies-time')
            || !Unknown.hasProp(settings, 'general-settings')
        ) {
            throw new Error(`Invalid settings provided: ${JSON.stringify(settings)}`);
        }

        const FILTERS = 'filters';
        const ALLOWLIST = 'whitelist';
        const { filters } = settings;
        const allowlist = filters[ALLOWLIST];
        if (!allowlist) {
            throw new Error('Not found field "filters.whitelist" for migrate to '
                + `"filters.allowlist" in the settings: ${settings}`);
        }

        Object.assign(filters, { allowlist });
        Object.assign(settings, { 'protocol-version': '2.0' });

        delete settings[FILTERS][ALLOWLIST];

        // Moves the value to the new field key without an underscore.
        const { stealth } = settings;
        const OLD_STEALTH_KEY = 'stealth_disable_stealth_mode';
        const disableStealthMode = stealth[OLD_STEALTH_KEY];
        Object.assign(stealth, { [StealthOption.DisableStealthMode]: disableStealthMode });
        delete settings['stealth'][OLD_STEALTH_KEY];

        // Parsing stealth cookie time values from string values (with possible
        // escaped quotes) to numeric values.
        const FIRST_PARTY_COOKIES_TIME = 'stealth-block-first-party-cookies-time';
        if (typeof stealth[FIRST_PARTY_COOKIES_TIME] === 'string') {
            const rawValue = stealth[FIRST_PARTY_COOKIES_TIME];
            const parsedValue = Number(JSON.parse(rawValue));
            stealth[FIRST_PARTY_COOKIES_TIME] = parsedValue;
        }

        const THIRD_PARTY_COOKIES_TIME = 'stealth-block-third-party-cookies-time';
        if (typeof stealth[THIRD_PARTY_COOKIES_TIME] === 'string') {
            const rawValue = stealth[THIRD_PARTY_COOKIES_TIME];
            const parsedValue = Number(JSON.parse(rawValue));
            stealth[THIRD_PARTY_COOKIES_TIME] = parsedValue;
        }

        // Parsing appearance theme with escaped quotes.
        const APPEARANCE_THEME = 'appearance-theme';
        const GENERAL_SETTINGS = 'general-settings';
        // Check optional field.
        if (Unknown.hasProp(settings[GENERAL_SETTINGS], APPEARANCE_THEME)
            && typeof settings[GENERAL_SETTINGS][APPEARANCE_THEME] === 'string'
            && settings[GENERAL_SETTINGS][APPEARANCE_THEME].includes('\"')
        ) {
            const rawValue = settings[GENERAL_SETTINGS][APPEARANCE_THEME];
            // Removes escaped quotes.
            const parsedValue = JSON.parse(rawValue);
            settings[GENERAL_SETTINGS][APPEARANCE_THEME] = parsedValue;
        }

        // Sets the missing 'enabled' and 'trusted' fields to custom filters.
        const CUSTOM_FILTERS = 'custom-filters';
        const customFilters = filters[CUSTOM_FILTERS];
        if (Array.isArray(customFilters)) {
            for (let i = 0; i < customFilters.length; i += 1) {
                const customFilter = customFilters[i];

                if (customFilter.enabled === undefined) {
                    customFilter.enabled = false;
                }

                if (customFilter.trusted === undefined) {
                    customFilter.trusted = false;
                }

                // Remove deprecated field.
                if (customFilter.languages !== undefined) {
                    delete customFilter.languages;
                }
            }
        }

        return settings;
    }
}
