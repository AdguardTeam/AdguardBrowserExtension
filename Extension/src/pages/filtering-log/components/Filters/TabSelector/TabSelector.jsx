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
    useEffect,
    useState,
    useRef,
} from 'react';
import { observer } from 'mobx-react';

import cn from 'classnames';

import { translator } from '../../../../../common/translators/translator';
import { WASTE_CHARACTERS } from '../../../../../common/constants';
import { Icon } from '../../../../common/components/ui/Icon';
import { rootStore } from '../../../stores/RootStore';
import { useOutsideClick } from '../../../../common/hooks/useOutsideClick';
import { useOutsideFocus } from '../../../../common/hooks/useOutsideFocus';
import { useKeyDown } from '../../../../common/hooks/useKeyDown';
import { Search } from '../../Search';

import './tab-selector.pcss';

const TabSelector = observer(() => {
    const { logStore, wizardStore } = useContext(rootStore);
    const refSelector = useRef(null);
    const refResult = useRef(null);
    const searchInputRef = useRef(null);
    const { tabs, selectedTabId, selectIsOpen } = logStore;

    const [prevTabTitle, setPrevTabTitle] = useState('');
    const [searchValue, setSearchValue] = useState('');
    const [resultItems, setResultItems] = useState([]);
    const [currentStep, setCurrentStep] = useState(0);

    const SELECTED_CLASS_NAME = 'selected';
    const INPUT_ID = 'tabs-selector-input';
    const LISTBOX_ID = 'tabs-selector-listbox';
    const LABEL = translator.getMessage('filtering_log_search_tabs_placeholder');

    useEffect(() => {
        if (refResult.current?.childNodes) {
            setResultItems(Array.from(refResult.current.childNodes));
        }
    }, [selectIsOpen, searchValue]);

    useEffect(() => {
        if (resultItems) {
            resultItems.forEach(
                (el) => el.classList.remove(SELECTED_CLASS_NAME),
            );

            const currentEl = resultItems[currentStep];

            currentEl?.classList.add(SELECTED_CLASS_NAME);
            currentEl?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    }, [currentStep, resultItems]);

    const cancelTabSearch = () => {
        if (!tabs.find((tab) => tab.title === searchValue)) {
            setSearchValue(prevTabTitle);
        }
        if (selectIsOpen) {
            logStore.setSelectIsOpenState(false);
        }
        setCurrentStep(0);
    };

    const quitTabSearch = () => {
        cancelTabSearch();
        document.activeElement.blur();
    };

    useKeyDown(refResult, 'Escape', () => {
        if (searchValue.length === 0) {
            quitTabSearch();
        } else {
            setSearchValue('');
        }
    });

    useKeyDown(refResult, 'Enter', () => {
        // Selected with the arrow buttons
        const targetElem = resultItems?.find(
            (el) => el.classList.contains(SELECTED_CLASS_NAME),
        );
        // Selected with the tab button
        const activeElem = resultItems?.find(
            (el) => el === document.activeElement,
        );

        if (activeElem || targetElem) {
            (async () => {
                await selectionHandlerSearch(Number(activeElem ? activeElem.id : targetElem.id));
            })();
            document.activeElement.blur();
        }
    });

    useKeyDown(refResult, 'ArrowDown', () => {
        const lastIndex = resultItems.length - 1;
        const step = lastIndex > currentStep
            ? currentStep + 1 : 0;
        setCurrentStep(step);
    });

    useKeyDown(refResult, 'ArrowUp', () => {
        const lastIndex = resultItems.length - 1;
        const step = currentStep > 0
            ? currentStep - 1 : lastIndex;
        setCurrentStep(step);
    });

    useOutsideClick(refSelector, cancelTabSearch);

    useOutsideFocus(refSelector, cancelTabSearch);

    useEffect(() => {
        const selectedTab = tabs.find((tab) => tab.tabId === selectedTabId);
        const title = selectedTab?.title || '';
        setPrevTabTitle(title);
        if (!selectIsOpen) {
            setSearchValue(title);
        }
    }, [selectedTabId, tabs, selectIsOpen]);

    const selectionHandlerSearch = async (id) => {
        logStore.setSelectIsOpenState(false);
        setCurrentStep(0);
        if (selectedTabId === id) {
            setSearchValue(prevTabTitle);
        }
        await logStore.setSelectedTabId(id);
    };

    const renderSearchResult = () => {
        const searchValueString = searchValue.replace(WASTE_CHARACTERS, '\\$&');
        const searchQuery = new RegExp(searchValueString, 'ig');

        return tabs.map((tab) => {
            const { title, tabId, domain } = tab;

            const isActive = tabId === selectedTabId;

            const itemTextClassName = cn(
                'tab-selector__result-item--text',
                { 'tab-selector__result-item--text--active': isActive },
            );

            if (
                title.match(searchQuery)
                || (domain && domain.match(searchQuery))
            ) {
                return (
                    <button
                        key={tabId}
                        id={tabId}
                        type="button"
                        role="option"
                        aria-selected={isActive}
                        className="tab-selector__result-item"
                        onClick={() => selectionHandlerSearch(tabId)}
                        tabIndex={0}
                    >
                        <span className={itemTextClassName}>
                            {title}
                        </span>
                        {isActive && (
                            <Icon
                                id="#tick"
                                className="icon icon--24 icon--green-default"
                                aria-hidden="true"
                            />
                        )}
                    </button>
                );
            }

            return null;
        });
    };

    const searchChangeHandler = (value) => {
        setCurrentStep(0);
        setSearchValue(value);
    };

    const handleClear = () => {
        setSearchValue('');
        wizardStore.closeModal();
        logStore.setSelectIsOpenState(true);
    };

    const onTabSelectorFocus = () => {
        if (selectIsOpen) {
            quitTabSearch();
        } else {
            searchInputRef.current.focus();
        }
    };

    return (
        <div
            id="tab-selector"
            className="tab-selector"
            ref={refSelector}
        >
            <div onFocus={onTabSelectorFocus}>
                <Search
                    ref={searchInputRef}
                    id={INPUT_ID}
                    role="combobox"
                    value={searchValue}
                    placeholder={LABEL}
                    // Take a not that `autoComplete` and `aria-autocomplete` are different attributes
                    // `autoComplete` is for the browser to suggest the input value
                    // `aria-autocomplete` is for the screen reader to announce that the input has a list of tabs
                    aria-autocomplete="list"
                    aria-expanded={selectIsOpen}
                    aria-controls={LISTBOX_ID}
                    onChange={searchChangeHandler}
                    onFocus={handleClear}
                    control={(
                        <button
                            type="button"
                            className="search__btn"
                            tabIndex={-1}
                            aria-label={LABEL}
                            aria-expanded={selectIsOpen}
                            aria-controls={LISTBOX_ID}
                        >
                            <Icon
                                id="#arrow-down"
                                className={cn(
                                    'icon--24 icon--gray-default search__ico',
                                    selectIsOpen ? 'search__arrow-up' : 'search__arrow-down',
                                )}
                                aria-hidden="true"
                            />
                        </button>
                    )}
                />
            </div>
            <div
                ref={refResult}
                id={LISTBOX_ID}
                role="listbox"
                className={cn(
                    'tab-selector__result thin-scrollbar',
                    selectIsOpen && 'tab-selector__result--open',
                )}
            >
                {renderSearchResult()}
            </div>
        </div>
    );
});

export { TabSelector };
