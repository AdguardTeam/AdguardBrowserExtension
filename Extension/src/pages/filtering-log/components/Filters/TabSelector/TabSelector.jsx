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

/*
eslint-disable jsx-a11y/click-events-have-key-events,
jsx-a11y/no-noninteractive-element-interactions
*/
import React, {
    useContext,
    useEffect,
    useState,
    useRef,
} from 'react';
import cn from 'classnames';
import { observer } from 'mobx-react';

import { rootStore } from '../../../stores/RootStore';
import { reactTranslator } from '../../../../../common/translators/reactTranslator';
import { useOutsideClick } from '../../../../common/hooks/useOutsideClick';
import { useOutsideFocus } from '../../../../common/hooks/useOutsideFocus';
import { useKeyDown } from '../../../../common/hooks/useKeyDown';
import { WASTE_CHARACTERS } from '../../../../../common/constants';

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
        logStore.setSelectIsOpenState(false);
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
            const { title, tabId } = tab;

            const itemClassName = cn(
                'tab-selector__result-item',
                { 'tab-selector__result-item--active': tabId === selectedTabId },
            );

            if (title.match(searchQuery)) {
                return (
                    <button
                        key={tabId}
                        id={tabId}
                        type="button"
                        className={itemClassName}
                        onClick={() => { selectionHandlerSearch(tabId); }}
                    >
                        {title}
                    </button>
                );
            }

            return null;
        });
    };

    const searchChangeHandler = (e) => {
        setCurrentStep(0);
        setSearchValue(e.currentTarget.value);
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
                    select
                    ref={searchInputRef}
                    changeHandler={searchChangeHandler}
                    value={searchValue}
                    placeholder={reactTranslator.getMessage('filtering_log_search_tabs_placeholder')}
                    handleClear={handleClear}
                    onFocus={handleClear}
                    onOpenSelect={selectIsOpen}
                />
            </div>
            {selectIsOpen && (
                <div className="tab-selector__result" ref={refResult}>
                    {renderSearchResult()}
                </div>
            )}
        </div>
    );
});

export { TabSelector };
