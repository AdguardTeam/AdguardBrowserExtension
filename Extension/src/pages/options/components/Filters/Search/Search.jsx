/* eslint-disable jsx-a11y/no-autofocus */
import React, { useContext, useRef } from 'react';
import { observer } from 'mobx-react';

import { reactTranslator } from '../../../../../common/translators/reactTranslator';
import { Select } from '../../../../common/components/ui/Select';
import { Icon } from '../../../../common/components/ui/Icon';
import { rootStore } from '../../../stores/RootStore';
import { SEARCH_FILTERS } from './constants';

import './search.pcss';

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

    const {
        setSearchInput,
        searchInput,
        setSearchSelect,
        searchSelect,
    } = settingsStore;

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

    return (
        <div className="search">
            <label className="search__label" htmlFor="search__input">
                <input
                    id="search__input"
                    autoFocus
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
