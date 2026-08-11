/**
 * Copyright (c) 2015-2026 Adguard Software Ltd.
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

import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../stores/RootStore';
import { containsIgnoreCase } from '../../../../helpers';
import { Highlight } from '../../../../common/components/ui/Highlight';

import './search.pcss';

const highlightClass = 'filter__search';

/**
 * Props for the {@link HighlightSearch} component.
 */
type HighlightSearchProps = {
    /**
     * The text to render, highlighting occurrences of the current search input.
     */
    string: string;
};

const HighlightSearch = observer(({ string }: HighlightSearchProps) => {
    const { settingsStore: { searchInput } } = useContext(rootStore);

    if (searchInput.length === 0 || !containsIgnoreCase(string, searchInput)) {
        // eslint-disable-next-line react/jsx-no-useless-fragment
        return <>{string}</>;
    }

    return <Highlight text={string} term={searchInput} highlightClassName={highlightClass} />;
});

export { HighlightSearch };
