import React, { useRef } from 'react';
import { Icon } from '../../../common/components/ui/Icon';

import './search.pcss';

const Search = ({
    changeHandler, handleClear, onFocus, value, placeholder, select,
}) => {
    const searchInputRef = useRef();

    const onSubmit = (e) => {
        e.preventDefault();
    };

    const onChange = (e) => {
        changeHandler(e);
    };

    const onClear = () => {
        searchInputRef.current.focus();
        if (handleClear) {
            handleClear();
        }
    };

    const Control = () => {
        if (value && !select) {
            return (
                <button
                    type="button"
                    className="search__clear"
                    onClick={onClear}
                >
                    <Icon id="#cross" classname="search__cross" />
                </button>
            );
        }

        return <Icon id={select ? '#arrow-bottom' : '#magnifying'} classname="search__ico" />;
    };

    return (
        <form
            className="search"
            onSubmit={onSubmit}
        >
            <Control />
            <input
                type="text"
                id="log-search"
                name="log-search"
                placeholder={placeholder}
                ref={searchInputRef}
                onChange={onChange}
                onFocus={onFocus}
                value={value}
                autoComplete="off"
            />
        </form>
    );
};

export { Search };
