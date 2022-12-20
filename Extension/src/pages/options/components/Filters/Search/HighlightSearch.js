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

import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import cn from 'classnames';

import { rootStore } from '../../../stores/RootStore';
import { containsIgnoreCase, findChunks } from '../../../../helpers';

const HighlightSearch = observer(({ string }) => {
    const { settingsStore: { searchInput } } = useContext(rootStore);

    const renderStr = () => {
        const strChunks = findChunks(string, searchInput);

        const displayName = strChunks.map((chunk, i) => {
            const isSearchMatch = chunk.toLowerCase() === searchInput.toLowerCase();
            const chunkClassName = cn({
                filter__search: isSearchMatch,
            });
            return (
                <span
                    key={i} // eslint-disable-line react/no-array-index-key
                    className={chunkClassName}
                >
                    {chunk}
                </span>
            );
        });

        return displayName;
    };

    return searchInput.length > 0 && containsIgnoreCase(string, searchInput)
        ? renderStr()
        : string;
});

export { HighlightSearch };
