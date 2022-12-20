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

export const customFilterMetadataValidator = zod.object({
    filterId: zod.number(),
    displayNumber: zod.number(),
    groupId: zod.number(),
    name: zod.string(),
    description: zod.string(),
    homepage: zod.string(),
    tags: zod.number().array(),
    customUrl: zod.string(),
    trusted: zod.boolean(),
    checksum: zod.string().or(zod.null()),
    version: zod.string(),
    expires: zod.number(),
    timeUpdated: zod.number(),
    languages: zod.string().array().optional(),
});

export type CustomFilterMetadata = zod.infer<typeof customFilterMetadataValidator>;

export const customFilterMetadataStorageDataValidator = customFilterMetadataValidator.array();

export type CustomFilterMetadataStorageData = zod.infer<typeof customFilterMetadataStorageDataValidator>;
