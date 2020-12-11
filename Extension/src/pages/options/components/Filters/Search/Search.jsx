import React from 'react';
import PropTypes from 'prop-types';

import { reactTranslator } from '../../../../reactCommon/reactTranslator';
import { Icon } from '../../../../common/components/ui/Icon';
import { Select } from '../../../../common/components/ui/Select';

import './search.pcss';

const Search = ({
    searchInputHandler,
    searchSelectHandler,
    searchInput,
    searchSelect,
    searchCloseHandler,
}) => {
    const options = [
        {
            value: 'all',
            title: reactTranslator.translate('options_filters_list_search_display_option_all'),
        },
        {
            value: 'enabled',
            title: reactTranslator.translate('options_filters_list_search_display_option_enabled'),
        },
        {
            value: 'disabled',
            title: reactTranslator.translate('options_filters_list_search_display_option_disabled'),
        },
    ];
    return (
        <div className="search">
            <Icon id="#magnifying" classname="icon--magnifying" />
            <input
                className="search__input"
                type="text"
                onChange={searchInputHandler}
                value={searchInput}
            />
            {searchInput && (
                <button
                    type="button"
                    className="button"
                    onClick={searchCloseHandler}
                >
                    <Icon id="#cross" classname="search__cross" />
                </button>
            )}
            <Select
                id="search-select"
                handler={searchSelectHandler}
                options={options}
                value={searchSelect}
            />
        </div>
    );
};

Search.propTypes = {
    searchInputHandler: PropTypes.func.isRequired,
    searchSelectHandler: PropTypes.func.isRequired,
    searchCloseHandler: PropTypes.func.isRequired,
    searchInput: PropTypes.string.isRequired,
    searchSelect: PropTypes.string.isRequired,
};

export { Search };
