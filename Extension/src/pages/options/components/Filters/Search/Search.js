import React from 'react';
import PropTypes from 'prop-types';
import './search.pcss';

export default function Search(props) {
    const {
        searchInputHandler,
        searchSelectHandler,
        searchInput,
        searchSelect,
        searchCloseHandler,
    } = props;
    return (
        <div className="search">
            <div className="search__ico" />
            <input
                className="search__input"
                type="text"
                onChange={searchInputHandler}
                value={searchInput}
            />
            <select
                name="select_time"
                className="search__select"
                value={searchSelect}
                onChange={searchSelectHandler}
            >
                <option value="all">
                    All
                </option>
                <option value="enabled">
                    Enabled
                </option>
                <option value="disabled">
                    Disabled
                </option>
            </select>
            <button
                type="button"
                className="button search__cross"
                onClick={searchCloseHandler}
            />
        </div>
    );
}

Search.propTypes = {
    searchInputHandler: PropTypes.func.isRequired,
    searchSelectHandler: PropTypes.func.isRequired,
    searchCloseHandler: PropTypes.func.isRequired,
    searchInput: PropTypes.string.isRequired,
    searchSelect: PropTypes.string.isRequired,
};
