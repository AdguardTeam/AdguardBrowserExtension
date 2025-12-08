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

const groupInfo = zod.object({
    /**
     * The name of the filter group.
     */
    name: zod.string(),

    /**
     * The description of the filter group.
     */
    description: zod.string(),
});

export const groupI18nMetadataValidator = zod.record(
    /**
     * Locale code.
     */
    zod.string(),
    groupInfo,
);

/**
 * Describes an object in which the language codes are keys and the group name
 * is the value.
 */
export type GroupI18nMetadata = zod.infer<typeof groupI18nMetadataValidator>;
