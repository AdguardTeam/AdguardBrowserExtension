import React from 'react';
import PropTypes from 'prop-types';

import { reactTranslator } from '../../../../reactCommon/reactTranslator';

import './search.pcss';

const Search = ({
    searchInputHandler,
    searchSelectHandler,
    searchInput,
    searchSelect,
    searchCloseHandler,
}) => (
    <div className="search">
        <div className="search__ico" />
        <input
            className="search__input"
            type="text"
            onChange={searchInputHandler}
            value={searchInput}
        />
        {searchInput && (
            <button
                type="button"
                className="button search__cross"
                onClick={searchCloseHandler}
            />
        )}
        <select
            name="select_time"
            className="search__select"
            value={searchSelect}
            onChange={searchSelectHandler}
        >
            <option value="all">
                {reactTranslator.translate('options_filters_list_search_display_option_all')}
            </option>
            <option value="enabled">
                {reactTranslator.translate('options_filters_list_search_display_option_enabled')}
            </option>
            <option value="disabled">
                {reactTranslator.translate('options_filters_list_search_display_option_disabled')}
            </option>
        </select>
    </div>
);

Search.propTypes = {
    searchInputHandler: PropTypes.func.isRequired,
    searchSelectHandler: PropTypes.func.isRequired,
    searchCloseHandler: PropTypes.func.isRequired,
    searchInput: PropTypes.string.isRequired,
    searchSelect: PropTypes.string.isRequired,
};

export { Search };
