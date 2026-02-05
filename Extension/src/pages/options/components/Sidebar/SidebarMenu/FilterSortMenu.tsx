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
import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { Icon } from '../../../../common/components/ui/Icon';
import { rootStore } from '../../../stores/RootStore';
import { MenuDropDown } from '../../../../common/components/ui/MenuDropDown';
import { filterStatusOptions } from '../../Filters/constants';
import { type SearchFilters } from '../../Filters/Search/constants';

import styles from './SidebarMenu.module.pcss';

export const FilterSortMenu = observer(() => {
    const { settingsStore } = useContext(rootStore);

    const searchSelectHandler = (value: SearchFilters) => {
        settingsStore.setSearchSelect(value);
        settingsStore.sortFilters();
        settingsStore.sortSearchGroups();
    };

    return (
        <MenuDropDown>
            {filterStatusOptions.map(({ value, title }) => {
                const isSelected = value === settingsStore.searchSelect;

                return (
                    <button
                        key={value}
                        type="button"
                        className={styles.filterSortItem}
                        onClick={() => searchSelectHandler(value)}
                        data-selected={isSelected}
                    >
                        <span>{title}</span>
                        {isSelected ? (
                            <Icon
                                id="#tick"
                                className="icon--24 icon--green-default"
                                aria-hidden="true"
                            />
                        ) : null}
                    </button>
                );
            })}
        </MenuDropDown>
    );
});
