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

import {
    CLOUD_PREFERENCE_KEYS,
    CloudErrorCode,
    CloudSyncError,
    equalCloudPreferences,
    parseCloudPreferences,
    type CloudPreferences,
} from './cloud-sync';

export type CloudApplyResult = { ok: true } | { ok: false; code: CloudErrorCode };

type PreferencesAccess = {
    read: () => CloudPreferences;
    write: (key: keyof CloudPreferences, value: CloudPreferences[keyof CloudPreferences]) => Promise<void>;
    persist: () => Promise<void>;
};

/** Uses the existing per-setting events; failures are explicitly non-atomic, never reported as success. */
export const createCloudPreferencesApplier = ({ read, write, persist }: PreferencesAccess) => {
    let busy = false;
    return async (expected: unknown, incoming: unknown): Promise<CloudApplyResult> => {
        if (busy) {
            return { ok: false, code: CloudErrorCode.Busy };
        }
        busy = true;
        let changed = false;
        try {
            const before = parseCloudPreferences(expected);
            const target = parseCloudPreferences(incoming);
            const progress = { ...before };
            for (const key of CLOUD_PREFERENCE_KEYS) {
                if (!equalCloudPreferences(read(), progress)) {
                    throw new CloudSyncError(CloudErrorCode.LocalChanged);
                }
                if (target[key] !== progress[key]) {
                    changed = true;
                    await write(key, target[key]);
                    Object.assign(progress, { [key]: target[key] });
                }
            }
            await persist();
            if (!equalCloudPreferences(read(), target)) {
                throw new CloudSyncError(CloudErrorCode.LocalChanged);
            }
            return { ok: true };
        } catch (error) {
            // Do not roll back over edits from another options tab or a setting event listener.
            const code = !changed && error instanceof CloudSyncError ? error.code : CloudErrorCode.Apply;
            return { ok: false, code };
        } finally {
            busy = false;
        }
    };
};
