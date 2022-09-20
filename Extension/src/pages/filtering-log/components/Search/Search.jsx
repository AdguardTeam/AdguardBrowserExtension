import React, { useRef, forwardRef, useEffect } from 'react';
import cn from 'classnames';
import { Icon } from '../../../common/components/ui/Icon';
import { reactTranslator } from '../../../../common/translators/reactTranslator';
import { isMacOs } from '../../../../common/user-agent-utils';

import './search.pcss';

const Search = forwardRef(({
    changeHandler, handleClear, onFocus, value, placeholder, select, onOpenSelect,
}, passedRef) => {
    const localSearchInputRef = useRef(null);

    useEffect(() => {
        const modifierKeyProperty = isMacOs ? 'metaKey' : 'ctrlKey';
        const handleSearchHotkey = (e) => {
            const { code } = e;
            if (e[modifierKeyProperty] && code === 'KeyF') {
                e.preventDefault();
                localSearchInputRef.current.focus();
                localSearchInputRef.current.select();
            }
        };

        window.addEventListener('keydown', handleSearchHotkey);
        return function onUnmount() {
            window.removeEventListener('keydown', handleSearchHotkey);
        };
    }, [localSearchInputRef]);

    const onSubmit = (e) => {
        e.preventDefault();
    };

    const onChange = (e) => {
        changeHandler(e);
    };

    const onClear = () => {
        localSearchInputRef.current.focus();
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
                    aria-label={reactTranslator.getMessage('close_button_title')}
                    onClick={onClear}
                >
                    <Icon id="#cross" classname="search__cross" />
                </button>
            );
        }

        if (select) {
            return (
                <button
                    type="button"
                    className="search__btn"
                >
                    <Icon
                        id="#arrow-bottom"
                        classname={cn(
                            'search__ico',
                            onOpenSelect ? 'search__arrow-up' : 'search__arrow-down',
                        )}
                    />
                </button>
            );
        }

        return <Icon id="#magnifying" classname="search__ico" />;
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
                className="search__input"
                placeholder={placeholder}
                ref={passedRef || localSearchInputRef}
                onChange={onChange}
                onFocus={onFocus}
                value={value}
                autoComplete="off"
            />
        </form>
    );
});

export { Search };
