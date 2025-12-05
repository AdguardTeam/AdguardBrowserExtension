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

import { regularFilterI18nMetadataValidator } from './filter';
import { tagI18nMetadataValidator } from './tag';
import { groupI18nMetadataValidator } from './group';

const filtersI18nRecordValidator = zod.record(
    SchemaPreprocessor.numberValidator,
    regularFilterI18nMetadataValidator,
);

/**
 * Describes an object where the language codes are keys and the description and
 * filter name are values.
 */
export type FiltersI18n = zod.infer<typeof filtersI18nRecordValidator>;

const groupsI18nRecordValidator = zod.record(SchemaPreprocessor.numberValidator, groupI18nMetadataValidator);

/**
 * Describes an object in which the language codes are keys and the group name
 * is the value.
 */
export type GroupsI18n = zod.infer<typeof groupsI18nRecordValidator>;

const tagsI18nRecordValidator = zod.record(SchemaPreprocessor.numberValidator, tagI18nMetadataValidator);

/**
 * Describes an object where the language codes are keys and the description and
 * tag name are values.
 */
export type TagsI18n = zod.infer<typeof tagsI18nRecordValidator>;

export const i18nMetadataValidator = zod.object({
    /**
     * Item of {@link FiltersI18n}.
     */
    filters: filtersI18nRecordValidator,
    /**
     * Item of {@link GroupsI18n}.
     */
    groups: groupsI18nRecordValidator,
    /**
     * Item of {@link TagsI18n}.
     */
    tags: tagsI18nRecordValidator,
});

/**
 * Describes the root object with translations to all filters, groups and tags.
 */
export type I18nMetadata = zod.infer<typeof i18nMetadataValidator>;
