import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { Icon } from '../../../../common/components/ui/Icon';
import { Select } from '../../../../common/components/ui/Select';
import { rootStore } from '../../../stores/RootStore';
import { SEARCH_FILTERS } from './constants';

import './search.pcss';
import { reactTranslator } from '../../../../../common/translators/reactTranslator';

const options = [
    {
        value: SEARCH_FILTERS.ALL,
        title: reactTranslator.getMessage('options_filters_list_search_display_option_all'),
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
        }
    };

    const searchCloseHandler = () => {
        setSearchInput('');
        setSearchSelect(SEARCH_FILTERS.ALL);
        settingsStore.sortFilters();
    };

    const searchSelectHandler = (e) => {
        const { value } = e.target;
        setSearchSelect(value);
        settingsStore.sortFilters();
    };

    return (
        <div className="search">
            <input
                autoFocus
                className="search__input"
                type="text"
                placeholder={reactTranslator.getMessage('search')}
                onChange={searchInputHandler}
                value={searchInput}
            />
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
