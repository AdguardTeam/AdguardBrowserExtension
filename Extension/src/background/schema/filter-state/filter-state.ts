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
import { SchemaPreprocessor } from '../preprocessor';

/**
 * Runtime validator for persistent filter state data
 */
export const filterStateDataValidator = zod.object({
    enabled: zod.boolean(),
    installed: zod.boolean(),
    loaded: zod.boolean(),
});

export type FilterStateData = zod.infer<typeof filterStateDataValidator>;

/**
 * Runtime validator for persistent key value storage of filter state data.
 *
 * Key is filter metadata id.
 * Value is {@link FilterStateData}.
 */
export const filterStateStorageDataValidator = zod.record(
    SchemaPreprocessor.numberValidator,
    filterStateDataValidator,
);

export type FilterStateStorageData = zod.infer<typeof filterStateStorageDataValidator>;
