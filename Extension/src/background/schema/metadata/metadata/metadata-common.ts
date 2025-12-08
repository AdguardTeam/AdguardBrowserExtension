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

import { regularFilterMetadataValidator } from '../filter';
import { tagMetadataValidator } from '../tag';
import { groupMetadataValidator } from '../group';

/**
 * Common metadata validator schema shared between MV2 and MV3 versions.
 * Contains base fields: locale, filters, groups, tags.
 * Extended by MV3 version with additional fields and validation.
 */
export const metadataValidatorCommon = zod.object({
    /**
     * The current locale used for localization.
     * Metadata is localized once during initialization.
     * If the locale does not change, we use cached metadata; otherwise, we update the localizations.
     */
    locale: zod.string().optional(),

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
});
