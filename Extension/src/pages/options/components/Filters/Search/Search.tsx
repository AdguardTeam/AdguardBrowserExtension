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

/* eslint-disable jsx-a11y/no-autofocus */
import React, {
    useContext,
    useRef,
    useEffect,
} from 'react';
import { observer } from 'mobx-react';

import { translator } from '../../../../../common/translators/translator';
import { Select } from '../../../../common/components/ui/Select';
import { Icon } from '../../../../common/components/ui/Icon';
import { UserAgent } from '../../../../../common/user-agent';
import { TABLET_SCREEN_WIDTH } from '../../../../common/constants';
import { rootStore } from '../../../stores/RootStore';
import { filterStatusOptions } from '../constants';

import { SearchFilters } from './constants';

import './search.pcss';

const isDesktopScreen = window.innerWidth > TABLET_SCREEN_WIDTH;

const Search = observer(() => {
    const { settingsStore } = useContext(rootStore);

    const searchInputRef = useRef<HTMLInputElement>(null);

    const searchRef = useRef<HTMLDivElement>(null);

    const {
        setSearchInput,
        searchInput,
        setSearchSelect,
        searchSelect,
    } = settingsStore;

    useEffect(() => {
        // If keys changed, change aria-keyshortcuts attributes
        const modifierKeyProperty = UserAgent.isMacOs ? 'metaKey' : 'ctrlKey';
        const handleSearchHotkey = (e: KeyboardEvent) => {
            const { code } = e;
            if (e[modifierKeyProperty] && code === 'KeyF') {
                e.preventDefault();
                searchInputRef.current?.focus();
                searchInputRef.current?.select();
            }
        };
        const handleResetHotkey = (e: KeyboardEvent) => {
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

    const searchInputHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;
        setSearchInput(value);
        if (value.length === 0) {
            settingsStore.sortFilters();
            settingsStore.sortSearchGroups();
        }
    };

    const searchCloseHandler = () => {
        setSearchInput('');
        searchInputRef.current?.focus();
        setSearchSelect(SearchFilters.ALL);
        settingsStore.sortFilters();
        settingsStore.sortSearchGroups();
    };

    const searchSelectHandler = (value: string) => {
        setSearchSelect(value as SearchFilters);
        settingsStore.sortFilters();
        settingsStore.sortSearchGroups();
    };

    const onSearchInputFocus = () => {
        searchRef.current?.classList.add('search--focused');
    };

    const onSearchInputBlur = () => {
        searchRef.current?.classList.remove('search--focused');
    };

    useEffect(() => {
        // autofocus triggers the keypad on mobile devices, which worsens tab navigation
        // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/2117
        if (searchInputRef.current && isDesktopScreen) {
            searchInputRef.current?.focus();
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
                    autoComplete="off"
                    placeholder={translator.getMessage('options_filters_search')}
                    ref={searchInputRef}
                    onChange={searchInputHandler}
                    value={searchInput}
                    aria-keyshortcuts={UserAgent.isMacOs ? 'Meta+F' : 'Ctrl+F'}
                />
            </label>
            {searchInput && (
                <button
                    type="button"
                    className="button"
                    onClick={searchCloseHandler}
                    title={translator.getMessage('clear_button_title')}
                    aria-keyshortcuts="Escape"
                >
                    <Icon
                        id="#cross"
                        className="icon--24 icon--gray-default"
                        aria-hidden="true"
                    />
                </button>
            )}
            <div className="search__select">
                <Select
                    id="search-select"
                    handler={searchSelectHandler}
                    options={filterStatusOptions}
                    value={searchSelect}
                    label={translator.getMessage('options_filters_search_filter')}
                />
            </div>
        </div>
    );
});

export { Search };
