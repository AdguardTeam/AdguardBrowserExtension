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

export const baseMetadataValidator = zod.object({
    /**
     * Description of the filter.
     */
    description: zod.string(),

    /**
     * Display number is used to arrange the filters in the layout.
     */
    displayNumber: zod.number(),

    /**
     * The time in seconds during which the filter content remains fresh
     * and does not need to be updated. Used to auto-renew filters if the user
     * has not selected a custom update period for filters.
     */
    expires: zod.number(),

    /**
     * Id of the filter.
     */
    filterId: zod.number(),

    /**
     * Id of the filter's group.
     */
    groupId: zod.number(),

    /**
     * URL address of the filter's homepage.
     */
    homepage: zod.string(),

    /**
     * Name of the filter.
     */
    name: zod.string(),

    /**
     * Filter tags are used to group filters by different characteristics:
     * language, target, platform, etc.
     */
    tags: zod.number().array(),

    /**
     * Version filter. Supports up to {@link Version.MAX_LENGTH} parts per
     * version.
     */
    version: zod.string(),

    /**
     * Diff-Path - Path to the patches if exists.
     *
     * @see {@link https://github.com/ameshkov/diffupdates/tree/b81243c50d23e0a8be0fe95a80d55abd00b08981?tab=readme-ov-file#-diff-path | Specs}.
     */
    diffPath: zod.string().optional(),
});

export const regularFilterMetadataValidator = baseMetadataValidator.merge(
    zod.object({
        /**
         * Two-letter language codes that are associated with the filter.
         */
        languages: zod.string().array(),

        /**
         * Timestamp of adding filters in MS.
         * String format, since these values are retrieved from the backend.
         */
        timeAdded: zod.string(),

        /**
         * When the filter was last updated in milliseconds since the start of
         * the UNIX epoch.
         * String format, since these values are retrieved from the backend.
         */
        timeUpdated: zod.string(),

        /**
         * The filter subscription URL from which the application retrieved
         * the rules when adding the filter and should retrieve the rules when
         * updating it.
         */
        subscriptionUrl: zod.string(),

        /**
         * Whether the filter is deprecated.
         *
         * @see {@link https://github.com/AdguardTeam/FiltersRegistry#metadata}
         */
        deprecated: zod.boolean().optional(),
    }),
);

/**
 * Filter metadata describes all the metadata (except its contents) of a filter
 * from {@link https://github.com/AdguardTeam/FiltersRegistry the AdGuard filter registry}
 * to work with it.
 */
export type RegularFilterMetadata = zod.infer<typeof regularFilterMetadataValidator>;
