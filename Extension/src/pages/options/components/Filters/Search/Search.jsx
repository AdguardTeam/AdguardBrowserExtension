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

/* eslint-disable jsx-a11y/no-autofocus */
import React, {
    useContext,
    useRef,
    useEffect,
} from 'react';
import { observer } from 'mobx-react';

import { reactTranslator } from '../../../../../common/translators/reactTranslator';
import { Select } from '../../../../common/components/ui/Select';
import { Icon } from '../../../../common/components/ui/Icon';
import { UserAgent } from '../../../../../common/user-agent';
import { rootStore } from '../../../stores/RootStore';
import { SEARCH_FILTERS, TABLET_SCREEN_WIDTH } from './constants';

import './search.pcss';

const isDesktopScreen = window.innerWidth > TABLET_SCREEN_WIDTH;

const options = [
    {
        value: SEARCH_FILTERS.ALL,
        title: reactTranslator.getMessage('options_filters_list_search_display_option_all_filters'),
    },
    {
        value: SEARCH_FILTERS.ENABLED,
        title: reactTranslator.getMessage('options_filters_list_search_display_option_enabled'),
    },
    {
        value: SEARCH_FILTERS.DISABLED,
        title: reactTranslator.getMessage('options_filters_list_search_display_option_disabled'),
    },
];

const Search = observer(() => {
    const { settingsStore } = useContext(rootStore);

    const searchInputRef = useRef();

    const searchRef = useRef();

    const {
        setSearchInput,
        searchInput,
        setSearchSelect,
        searchSelect,
    } = settingsStore;

    useEffect(() => {
        const modifierKeyProperty = UserAgent.isMacOs ? 'metaKey' : 'ctrlKey';
        const handleSearchHotkey = (e) => {
            const { code } = e;
            if (e[modifierKeyProperty] && code === 'KeyF') {
                e.preventDefault();
                searchInputRef.current.focus();
                searchInputRef.current.select();
            }
        };
        const handleResetHotkey = (e) => {
            const { code } = e;
            if (code === 'Escape') {
                e.preventDefault();
                setSearchInput('');
            }
        };

        window.addEventListener('keydown', handleSearchHotkey);
        window.addEventListener('keydown', handleResetHotkey);
        return function onUnmount() {
            window.removeEventListener('keydown', handleSearchHotkey);
            window.removeEventListener('keydown', handleResetHotkey);
        };
    }, [setSearchInput]);

    const searchInputHandler = (e) => {
        const { value } = e.target;
        setSearchInput(value);
        if (value.length === 0) {
            settingsStore.sortFilters();
            settingsStore.sortSearchGroups();
        }
    };

    const searchCloseHandler = () => {
        setSearchInput('');
        searchInputRef.current.focus();
        setSearchSelect(SEARCH_FILTERS.ALL);
        settingsStore.sortFilters();
        settingsStore.sortSearchGroups();
    };

    const searchSelectHandler = (value) => {
        setSearchSelect(value);
        settingsStore.sortFilters();
        settingsStore.sortSearchGroups();
    };

    const onSearchInputFocus = () => {
        if (searchRef.current) {
            searchRef.current.classList.add('search--focused');
        }
    };

    const onSearchInputBlur = () => {
        if (searchRef.current) {
            searchRef.current.classList.remove('search--focused');
        }
    };

    useEffect(() => {
        // autofocus triggers the keypad on mobile devices, which worsens tab navigation
        // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2117
        if (searchInputRef.current && isDesktopScreen) {
            searchInputRef.current.focus();
        }
    }, []);

    return (
        <div className="search" ref={searchRef}>
            <label className="search__label" htmlFor="search__input">
                <input
                    id="search__input"
                    onFocus={onSearchInputFocus}
                    onBlur={onSearchInputBlur}
                    className="search__input"
                    type="text"
                    placeholder={reactTranslator.getMessage('options_filters_search')}
                    ref={searchInputRef}
                    onChange={searchInputHandler}
                    value={searchInput}
                />
            </label>
            {searchInput ? (
                <button
                    type="button"
                    className="button"
                    aria-label={reactTranslator.getMessage('close_button_title')}
                    onClick={searchCloseHandler}
                >
                    <Icon id="#cross" classname="search__cross" />
                </button>
            ) : <Icon id="#magnifying" classname="icon--magnifying" />}
            <div className="search__select">
                <Select
                    id="search-select"
                    handler={searchSelectHandler}
                    options={options}
                    value={searchSelect}
                />
            </div>
        </div>
    );
});

export { Search };
