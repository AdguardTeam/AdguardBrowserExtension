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

import React, { useContext, useRef } from 'react';
import { observer } from 'mobx-react';

import { NavigationTag } from '../../../../../common/constants';
import { rootStore } from '../../../stores/RootStore';
import { Tags } from '../Tags';

import './miscellaneous-filters.pcss';

const MiscellaneousFilters = observer(() => {
    const ref = useRef(null);

    const { logStore } = useContext(rootStore);

    const {
        requestSourceFilters,
        setRequestSourceFilters,
        miscellaneousFilters,
        setMiscellaneousFilters,
    } = logStore;

    return (
        <div className="miscellaneous-filters">
            <div
                className="miscellaneous-filters__filters"
                ref={ref}
            >
                <div className="miscellaneous-filters__section">
                    <Tags
                        type={NavigationTag.Party}
                        tags={requestSourceFilters}
                        setTags={setRequestSourceFilters}
                    />
                </div>
                <div className="miscellaneous-filters__section">
                    <Tags
                        type={NavigationTag.Regular}
                        tags={miscellaneousFilters}
                        setTags={setMiscellaneousFilters}
                    />
                </div>
            </div>
        </div>
    );
});

export { MiscellaneousFilters };
