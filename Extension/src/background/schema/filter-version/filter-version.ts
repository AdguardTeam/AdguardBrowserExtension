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

import { SchemaPreprocessor } from '../preprocessor';

/**
 * Runtime validator for persistent filter version data.
 */
const filterVersionDataValidator = zod.object({
    /**
     * Version of filter. Usually consists of 4 parts: 1.2.3.4.
     */
    version: zod.string(),

    /**
     * The time in millisecond of the last forced update: if the user clicks
     * the forced update check from the user interface or if the user enabled
     * the filter or group.
     */
    lastCheckTime: zod.number(),

    /**
     * The time in millisecond of the last check by the scheduler: every
     * {@link FilterUpdateService.CHECK_PERIOD_MS period} the time of the last
     * check will be overwritten by the scheduler.
     */
    lastScheduledCheckTime: zod.number(),
    /**
     * The time in millisecond of the last update filter from remote resources.
     */
    lastUpdateTime: zod.number(),

    /**
     * The time in seconds during which the filter content remains fresh
     * and does not need to be updated. Used to auto-renew filters if the user
     * has not selected a custom update period for filters.
     */
    expires: zod.number(),

    /**
     * Diff-Path - Path to the patches if exists.
     *
     * @see {@link https://github.com/ameshkov/diffupdates/tree/b81243c50d23e0a8be0fe95a80d55abd00b08981?tab=readme-ov-file#-diff-path | Specs}.
     */
    diffPath: zod.string().optional(),

    /**
     * Flag that indicates that the filter could not be updated by patches
     * and should wait for the full update.
     *
     * @see {@link https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2717}
     */
    shouldWaitFullUpdate: zod.boolean().optional(),
});

/**
 * Describes the filter version and timestamps of the last filter check,
 * update and expiration.
 */
export type FilterVersionData = zod.infer<typeof filterVersionDataValidator>;

/**
 * Runtime validator for persistent key value storage of filter version data.
 *
 * Key is filter metadata id.
 * Value is {@link FilterVersionData}.
 */
export const filterVersionStorageDataValidator = zod.record(
    SchemaPreprocessor.numberValidator,
    filterVersionDataValidator,
);

/**
 * Describes an object with numeric keys and {@link FilterVersionData}
 * as values.
 */
export type FilterVersionStorageData = zod.infer<typeof filterVersionStorageDataValidator>;
