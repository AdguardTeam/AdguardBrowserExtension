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

import { regularFilterI18nMetadataValidator } from './filter';
import { tagI18nMetadataValidator } from './tag';
import { groupI18nMetadataValidator } from './group';
import { SchemaPreprocessor } from '../preprocessor';

export const filtersI18nRecordValidator = zod.record(
    SchemaPreprocessor.numberValidator,
    regularFilterI18nMetadataValidator,
);

export type FiltersI18n = zod.infer<typeof filtersI18nRecordValidator>;

export const groupsI18nRecordValidator = zod.record(SchemaPreprocessor.numberValidator, groupI18nMetadataValidator);

export type GroupsI18n = zod.infer<typeof groupsI18nRecordValidator>;

export const tagsI18nRecordValidator = zod.record(SchemaPreprocessor.numberValidator, tagI18nMetadataValidator);

export type TagsI18n = zod.infer<typeof tagsI18nRecordValidator>;

export const i18nMetadataValidator = zod.object({
    filters: filtersI18nRecordValidator,
    groups: groupsI18nRecordValidator,
    tags: tagsI18nRecordValidator,
});

export type I18nMetadata = zod.infer<typeof i18nMetadataValidator>;
