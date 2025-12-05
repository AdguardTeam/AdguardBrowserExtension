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

import React from 'react';

import { type TagMetadata } from '../../../../../background/schema';
import { translator } from '../../../../../common/translators/translator';

import { FilterTag } from './FilterTag';

type FilterTagsParams = {
    filterId: number;
    tags: TagMetadata[];
    disabled?: boolean;
};

export const FilterTags = ({ filterId, tags, disabled }: FilterTagsParams) => {
    if (tags.length === 0) {
        return null;
    }

    return (
        <ul
            className="filter__tags"
            aria-label={translator.getMessage('options_filters_filter_tags')}
        >
            {tags.map((tag) => (
                <FilterTag
                    key={tag.tagId}
                    filterId={filterId}
                    tag={tag}
                    disabled={disabled}
                />
            ))}
        </ul>
    );
};
