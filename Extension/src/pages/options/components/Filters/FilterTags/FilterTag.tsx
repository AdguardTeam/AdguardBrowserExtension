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

/* eslint-disable jsx-a11y/click-events-have-key-events,jsx-a11y/no-static-element-interactions */
import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { type TagMetadata } from '../../../../../background/schema';
import { rootStore } from '../../../stores/RootStore';
import { HighlightSearch } from '../Search/HighlightSearch';
import { Popover } from '../../../../common/components/ui/Popover';

type FilterTagParams = {
    filterId: number;
    tag: TagMetadata;
    disabled?: boolean;
};

export const FilterTag = observer(({ filterId, tag, disabled }: FilterTagParams) => {
    const { settingsStore } = useContext(rootStore);

    const tagString = `#${tag.keyword}`;
    const descriptionId = `filter-tag-desc-${filterId}-${tag.tagId}`;

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();

        if (!disabled) {
            // we remove other content of search input when user clicks to tag
            settingsStore.setSearchInput(tagString);
        }
    };

    return (
        <li className="filter__tag-wrapper">
            <Popover text={tag.description}>
                <button
                    type="button"
                    role="link"
                    className="filter__tag"
                    onClick={handleClick}
                    aria-describedby={descriptionId}
                    disabled={disabled}
                >
                    <HighlightSearch string={tagString} />
                    <span
                        id={descriptionId}
                        className="sr-only"
                        aria-hidden="true"
                    >
                        {tag.description}
                    </span>
                </button>
            </Popover>
        </li>
    );
});
