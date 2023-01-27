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

import { Unknown } from '../../../common/unknown';

/**
 * Migration type describes which action should apply to settings
 * when migration from version 'from' to version 'to'.
 */
type Migration = {
    from: string,
    to: string,
    action: (settings: unknown) => Promise<unknown>
};

/**
 * SettingsMigrations stores migrations to apply them for example when
 * import settings with outdated protocol version.
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
     * @throws Error when not found migration for current version or
     * not found action for migrate.
     *
     * @param protocolVersion Protocol version of provided JSON settings.
     * @param settings JSON settings with outdated version.
     * @returns JSON settings of the latest version.
     */
    public static async migrateSettings(protocolVersion: string, settings: unknown): Promise<unknown> {
        // Create copy to not modify arg value
        let settingsCopy = JSON.parse(JSON.stringify(settings)) as unknown;

        const migrations = this.settingsMigrationMap;

        let currentMigrationIdx = migrations.findIndex(migration => {
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
     * @throws Error when not found field 'filters.whitelist' to rename it.
     *
     * @param settings JSON settings with version 1.0.
     * @returns JSON settings of version 2.0.
     */
    private static async migrateFromV1_0toV2_0(settings: unknown): Promise<unknown> {
        if (!settings
            || !Unknown.hasProp(settings, 'filters')
            || !Unknown.hasProp(settings.filters, 'whitelist')) {
            throw new Error(`Invalid settings provided : ${settings}`);
        }

        const { filters } = settings;

        const allowlist = filters['whitelist'];
        if (!allowlist) {
            throw new Error('Not found field "filters.whitelist" for migrate to '
                + `"filters.allowlist" in the settings: ${settings}`);
        }

        Object.assign(filters, { allowlist });
        Object.assign(settings, { 'protocol-version': '2.0' });

        delete settings['filters']['whitelist'];

        return settings;
    }
}
