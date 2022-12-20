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
 * Runtime validator for persistent group state data
 */
export const groupStateDataValidator = zod.object({
    enabled: zod.boolean(),
    toggled: zod.boolean(),
});

export type GroupStateData = zod.infer<typeof groupStateDataValidator>;

/**
 * Runtime validator for persistent key value storage of group state data.
 *
 * Key is group metadata id.
 * Value is {@link GroupStateData}.
 */
export const groupStateStorageDataValidator = zod.record(
    SchemaPreprocessor.numberValidator,
    groupStateDataValidator,
);

export type GroupStateStorageData = zod.infer<typeof groupStateStorageDataValidator>;
