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

/* eslint-disable jsx-a11y/click-events-have-key-events,jsx-a11y/no-static-element-interactions */
import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../stores/RootStore';
import { HighlightSearch } from '../Search/HighlightSearch';

export const FilterTag = observer(({ tag }) => {
    const { settingsStore } = useContext(rootStore);

    const tagString = `#${tag.keyword}`;

    const handleClick = (e) => {
        e.preventDefault();
        // we remove other content of search input when user clicks to tag
        settingsStore.setSearchInput(tagString);
    };

    return (
        <div
            className="filter__tag"
            onClick={handleClick}
        >
            <HighlightSearch string={tagString} />
        </div>
    );
});
