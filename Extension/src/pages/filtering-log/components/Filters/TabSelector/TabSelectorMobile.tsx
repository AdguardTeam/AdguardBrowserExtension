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

import cn from 'classnames';

import { translator } from '../../../../../common/translators/translator';
import { Icon } from '../../../../common/components/ui/Icon';
import { rootStore } from '../../../stores/RootStore';
import { Search } from '../../Search';
import { useOutsideClick } from '../../../../common/hooks/useOutsideClick';

import { filterTabsBySearch } from './utils';
import { TabItem } from './TabItem';

import styles from './tab-selector-mobile.module.pcss';

export const TabSelectorMobile = observer(() => {
    const { logStore } = useContext(rootStore);
    const { tabs, selectedTabId } = logStore;

    const [isOpen, setIsOpen] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedTab = tabs.find((tab) => tab.tabId === selectedTabId);
    const selectedTabTitle = selectedTab?.title || translator.getMessage('filtering_log_title');

    useOutsideClick(containerRef, () => {
        setIsOpen(false);
        setSearchValue('');
    });

    const toggleOpen = () => {
        setIsOpen(!isOpen);
    };

    const handleTabSelect = async (tabId: number) => {
        await logStore.setSelectedTabId(tabId);
        setIsOpen(false);
        setSearchValue('');
    };

    const filteredTabs = filterTabsBySearch(tabs, searchValue);

    return (
        <div className={styles.tabSelector} ref={containerRef}>
            <button
                type="button"
                className={styles.tabSelectorHeader}
                onClick={toggleOpen}
                aria-expanded={isOpen}
                aria-label={translator.getMessage('filtering_log_search_tabs_placeholder')}
            >
                <span className={styles.tabSelectorTitle}>{selectedTabTitle}</span>
                <Icon
                    id="#arrow-down-mobile"
                    className={cn(
                        'icon--24',
                        'icon--gray-default',
                        styles.tabSelectorArrow,
                        isOpen && styles.tabSelectorArrowOpen,
                    )}
                    aria-hidden="true"
                />
            </button>
            {isOpen && (
                <div className={styles.tabSelectorDropdown}>
                    <div className={styles.tabSelectorSearch}>
                        <Search
                            value={searchValue}
                            placeholder={translator.getMessage('filtering_log_search_tabs_placeholder')}
                            onChange={setSearchValue}
                        />
                    </div>
                    <div className={cn(styles.tabSelectorList, 'thin-scrollbar')}>
                        {filteredTabs.map((tab) => (
                            <TabItem
                                key={tab.tabId}
                                title={tab.title}
                                tabId={tab.tabId}
                                isActive={tab.tabId === selectedTabId}
                                onSelect={handleTabSelect}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
});
