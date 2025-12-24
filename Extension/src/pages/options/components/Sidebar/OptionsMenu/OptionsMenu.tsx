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
import React, {
    useContext,
    useState,
    useRef,
} from 'react';
import { observer } from 'mobx-react';

import { Icon } from '../../../../common/components/ui/Icon';
import { rootStore } from '../../../stores/RootStore';
import { translator } from '../../../../../common/translators/translator';
import { useOutsideClick } from '../../../../common/hooks/useOutsideClick';
import { sortFilterOptions } from '../../Filters/constants';
import { SEARCH_FILTERS } from '../../Filters/Search/constants';

import styles from './OptionsMenu.module.pcss';

export const OptionsMenu = (
    { 
        children, 
        handleToggle,
        isOpen,
        setIsOpen

    }: { 
        children: React.ReactNode,
        handleToggle: () => void,
        isOpen: boolean,
        setIsOpen: (value: boolean) => void,
    }) => {

    const menuRef = useRef<HTMLDivElement | null>(null);

    useOutsideClick(menuRef, () => setIsOpen(false));
    
    return (
       <div className={styles.filterSortMenu} ref={menuRef}>
            <button
                type="button"
                className={styles.menuButton}
                onClick={handleToggle}
                aria-label={translator.getMessage('options_filters_search_filter')}
                aria-expanded={isOpen}
            >
                <Icon
                    id="#more-vertical"
                    className="icon--24 icon--gray-default"
                    aria-hidden="true"
                />
            </button>
            
            {isOpen && (
                <div className={styles.dropdown}>
                    {children}
                </div>
            )}
        </div>
    )
}

export const FilterSortMenu = observer(() => {
    const { settingsStore } = useContext(rootStore);
    const [isOpen, setIsOpen] = useState(false);

    const handleToggle = () => {
        setIsOpen((prev) => !prev);
    };

    const searchSelectHandler = (value: SEARCH_FILTERS) => {
        settingsStore.setSearchSelect(value);
        settingsStore.sortFilters();
        settingsStore.sortSearchGroups();
        setIsOpen(false);
    };

    return (
        <OptionsMenu
            handleToggle={handleToggle}
            isOpen={isOpen}
            setIsOpen={setIsOpen}
        >   
            {sortFilterOptions.map(({ value, title }) => {
                const isSelected = value === settingsStore.searchSelect;

                return (
                    <button
                        key={value}
                        type="button"
                        className={styles.dropdownItem}
                        onClick={() => searchSelectHandler(value)}
                        aria-selected={isSelected}
                    >
                        <span>{title}</span>
                        {isSelected ? (
                            <Icon
                                id="#tick"
                                className={`icon--20 icon--green-default ${styles.checkMark}`}
                                aria-hidden="true"
                            />
                        ) : null}
                    </button>
                );
            })}
        </OptionsMenu>
    );
});
