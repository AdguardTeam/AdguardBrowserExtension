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

import { z } from 'zod';

import { logger } from '../../common/logger';

/**
 * Extracts data only from valid objects.
 * Does not throw an error if one of the objects in the array is invalid.
 *
 * @param schema Zod schema.
 *
 * @returns Zod array schema.
 */
export function filteredArray<T>(schema: z.ZodType<T>): z.ZodEffects<z.ZodArray<z.ZodAny>, T[], T[]> {
    return z.any()
        .array()
        .transform((arr) => arr
            .map((item) => {
                const result = schema.safeParse(item);
                if (result.success) {
                    return item as T;
                }
                logger.info('[ext.zod-helpers]: Failed to parse item', result.error);
                return undefined;
            })
            .filter((item): item is T => Boolean(item)));
}
