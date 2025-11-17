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

import { regularFilterMetadataValidator } from './filter';
import { tagMetadataValidator } from './tag';
import { groupMetadataValidator } from './group';

/**
 * It extended with superRefine to customize validation for MV3 version, but
 * export only one validator and type.
 */
export const metadataValidator = zod.object({
    /**
     * The current locale used for localization.
     * Metadata is localized once during initialization.
     * If the locale does not change, we use cached metadata; otherwise, we update the localizations.
     */
    locale: zod.string().optional(),

    /**
     * The version of the metadata.
     * Should be present in MV3 only.
     */
    version: zod.string().optional(),

    /**
     * The timestamp of the version in milliseconds.
     * This is used to provide it during issue reporting.
     * Should be present in MV3 only.
     */
    versionTimestampMs: zod.number().optional(),

    /**
     * Array of {@link RegularFilterMetadata}.
     */
    filters: regularFilterMetadataValidator.array(),

    /**
     * Array of {@link GroupMetadata}.
     */
    groups: groupMetadataValidator.array(),

    /**
     * Array of {@link TagMetadata}.
     */
    tags: tagMetadataValidator.array(),
}).superRefine((data, ctx) => {
    if (!__IS_MV3__) {
        return;
    }

    /* eslint-disable jsdoc/require-jsdoc */
    if (!data.version) {
        ctx.addIssue({
            code: zod.ZodIssueCode.custom,
            message: '"version" is required in MV3',
            path: ['version'],
        });
    }
    if (typeof data.versionTimestampMs !== 'number') {
        ctx.addIssue({
            code: zod.ZodIssueCode.custom,
            message: '"versionTimestampMs" is required in MV3',
            path: ['versionTimestampMs'],
        });
    }
    /* eslint-enable jsdoc/require-jsdoc */
});

/**
 * Describes the root object with all filters, groups and tags.
 */
export type Metadata = zod.infer<typeof metadataValidator>;
