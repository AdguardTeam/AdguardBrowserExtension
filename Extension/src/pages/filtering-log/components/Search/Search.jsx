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

import React, {
    useRef,
    forwardRef,
    useEffect,
} from 'react';
import cn from 'classnames';
import { Icon } from '../../../common/components/ui/Icon';
import { UserAgent } from '../../../../common/user-agent';
import { reactTranslator } from '../../../../common/translators/reactTranslator';

import './search.pcss';

const Search = forwardRef(({
    changeHandler, handleClear, onFocus, value, placeholder, select, onOpenSelect,
}, passedRef) => {
    const localSearchInputRef = useRef(null);

    useEffect(() => {
        const modifierKeyProperty = UserAgent.isMacOs ? 'metaKey' : 'ctrlKey';
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
