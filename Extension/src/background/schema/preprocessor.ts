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
import zod from 'zod';

/**
 * In some cases we want to preprocessing input before validation
 * For example, cast loaded filter metadata item id field from string to number before validation:
 *
 * { filterId: "1", ... } -> { filterId: 1, ... }
 */
export class SchemaPreprocessor {
    /**
     * {@link zod} runtime validator with {@link castStringToBoolean} preprocessor
     */
    public static booleanValidator = zod.preprocess(SchemaPreprocessor.castStringToBoolean, zod.boolean());

    /**
     * {@link zod} runtime validator with {@link castStringToNumber} preprocessor
     */
    public static numberValidator = zod.preprocess(SchemaPreprocessor.castStringToNumber, zod.number());

    /**
     * If {@link value} is string, cast it to number, else returns original value.
     *
     * @param value - preprocessed value
     * @returns number value, if string passed, else returns original value
     */
    private static castStringToNumber(value: unknown): number | unknown {
        if (typeof value === 'string') {
            return Number(value);
        }

        return value;
    }

    /**
     * If {@link value} is string, cast it to boolean, else returns original value.
     *
     * @param value - preprocessed value
     * @returns boolean value, if string passed, else returns original value
     */
    private static castStringToBoolean(value: unknown): boolean | unknown {
        if (typeof value === 'string') {
            try {
                return Boolean(JSON.parse(value));
            } catch (e) {
                return value;
            }
        }

        return value;
    }
}
