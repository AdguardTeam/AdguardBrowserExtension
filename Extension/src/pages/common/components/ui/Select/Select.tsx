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
    useLayoutEffect,
    useCallback,
    useState,
} from 'react';

import cn from 'classnames';

import { Icon } from '../Icon';

import {
    getActionFromKey,
    getIndexByLetter,
    getUpdatedIndex,
    isElementInView,
    isScrollable,
    maintainScrollVisibility,
    SelectAction,
    type SelectOption,
} from './helpers';

import './select.pcss';

/**
 * Select component parameters.
 */
export type SelectProps = {
    /**
     * Select id.
     */
    id: string,

    /**
     * Select change handler.
     */
    handler: (value: string) => void,

    /**
     * List of select options.
     */
    options: SelectOption[],

    /**
     * Current select value.
     */
    value: string,

    /**
     * Select visibility.
     */
    hidden: boolean,

    /**
     * Set select visibility.
     */
    setHidden: (value: boolean) => void,

    /**
     * Flag whether the select is used in popup.
     */
    popupModification?: boolean,

    /**
     * Label for the select (used only for screen readers).
     */
    label?: string,
};

/**
 * Select wrapper props
 */
export type SelectWrapperProps = Omit<SelectProps, 'hidden' | 'setHidden'> & {
    /**
     * Use react context or not
     */
    withContext?: boolean
};

export const Select = ({
    id,
    handler,
    options,
    value,
    hidden,
    setHidden,
    popupModification = false,
    label,
}: SelectProps) => {
    const comboRef = useRef<HTMLButtonElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const optionRefs = useRef<(HTMLElement | null)[]>([]);

    const activeIndex = options.findIndex((option) => option.value === value);
    const activeOption = options[activeIndex];

    const [focusedIndex, setFocusedIndex] = useState(activeIndex === -1 ? 0 : activeIndex);
    const searchString = useRef('');
    const searchTimeoutId = useRef<NodeJS.Timeout | undefined>(undefined);
    const ignoreBlur = useRef(false);

    const comboId = `${id}-combo`;
    const listId = `${id}-list`;
    const getOptionId = (index: number) => {
        if (index < 0 || index >= options.length) {
            return undefined;
        }

        return `${id}-option-${index}`;
    };

    const classes = cn('select', popupModification && 'popup-modification');
    const listClasses = cn('select__list', hidden && 'select__list--hidden');

    const selectOption = useCallback((index: number) => {
        const option = options[index];
        if (!option) {
            return;
        }

        setFocusedIndex(index);
        handler(option.value);
    }, [handler, options]);

    const updateSelectState = useCallback((nextHidden: boolean, shouldFocus = true) => {
        const comboEl = comboRef.current;
        if (!comboEl || hidden === nextHidden) {
            return;
        }

        setHidden(nextHidden);

        if (nextHidden && !isElementInView(comboEl)) {
            comboEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        // move focus back to the combobox, if needed
        if (shouldFocus) {
            comboEl.focus();
        }
    }, [setHidden, hidden]);

    const onComboClick = () => {
        updateSelectState(!hidden, false);
    };

    // We are using custom event type because this method
    // used by both react-synthetic events and native events
    const onBlur = useCallback((event: { relatedTarget: any }) => {
        const listEl = listRef.current;

        // do nothing if relatedTarget is contained within listboxEl
        if (!listEl || listEl.contains(event.relatedTarget)) {
            return;
        }

        // do nothing if the blur event is ignored
        if (ignoreBlur.current) {
            ignoreBlur.current = false;
            return;
        }

        // select current option and close
        if (!hidden) {
            selectOption(focusedIndex);
            updateSelectState(true, false);
        }
    }, [selectOption, updateSelectState, hidden, focusedIndex]);

    const onOptionChange = (index: number) => {
        const listEl = listRef.current;
        const optionEl = optionRefs.current[index];
        if (!listEl || !optionEl) {
            return;
        }

        setFocusedIndex(index);

        // ensure the new option is in view
        if (isScrollable(listEl)) {
            maintainScrollVisibility(optionEl, listEl);
        }

        // ensure the new option is visible on screen
        if (!isElementInView(optionEl)) {
            optionEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    };

    const getSearchString = (char: string) => {
        // reset typing timeout and start new timeout
        // this allows us to make multiple-letter matches, like a native select
        if (searchTimeoutId.current !== undefined) {
            clearTimeout(searchTimeoutId.current);
        }

        searchTimeoutId.current = setTimeout(() => {
            searchString.current = '';
        }, 500);

        searchString.current += char;
        return searchString.current;
    };

    const onComboType = (letter: string) => {
        // open the listbox if it is closed
        updateSelectState(false);

        // find the index of the first matching option
        const searchStringFromLetter = getSearchString(letter);
        const searchIndex = getIndexByLetter(
            options,
            searchStringFromLetter,
            focusedIndex + 1,
        );

        if (searchIndex >= 0) {
            // if a match was found, go to it
            onOptionChange(searchIndex);
        } else {
            // if no matches, clear the timeout and search string
            clearTimeout(searchTimeoutId.current);
            searchString.current = '';
        }
    };

    const onComboKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
        const action = getActionFromKey(event, hidden);

        switch (action) {
            case SelectAction.Last:
            case SelectAction.First:
                updateSelectState(false);
                // intentional fallthrough
            case SelectAction.Next:
            case SelectAction.Previous:
            case SelectAction.PageUp:
            case SelectAction.PageDown:
                event.preventDefault();
                return onOptionChange(getUpdatedIndex(focusedIndex, options.length - 1, action));
            case SelectAction.CloseSelect:
                event.preventDefault();
                selectOption(focusedIndex);
                // intentional fallthrough
            case SelectAction.Close:
                event.preventDefault();
                return updateSelectState(true);
            case SelectAction.Type:
                return onComboType(event.key);
            case SelectAction.Open:
                event.preventDefault();
                return updateSelectState(false);
            default:
                // do nothing
        }
    };

    const onOptionClick = (event: React.MouseEvent<HTMLDivElement>, index: number) => {
        event.preventDefault();
        onOptionChange(index);
        selectOption(index);
        updateSelectState(true);
    };

    const onOptionMouseDown = () => {
        ignoreBlur.current = true;
    };

    useLayoutEffect(() => {
        const listEl = listRef.current;
        if (!listEl) {
            return;
        }

        // Use 'focusout' instead of 'blur', because 'blur' doesn't bubble
        listEl.addEventListener('focusout', onBlur);

        return () => {
            listEl.removeEventListener('focusout', onBlur);
        };
    }, [onBlur]);

    if (!activeOption) {
        return null;
    }

    return (
        <div id={id} className={classes}>
            <button
                ref={comboRef}
                id={comboId}
                type="button"
                role="combobox"
                className="select__value"
                aria-controls={listId}
                aria-expanded={!hidden}
                aria-haspopup="listbox"
                aria-label={label}
                aria-activedescendant={hidden ? undefined : getOptionId(focusedIndex)}
                onClick={onComboClick}
                onBlur={onBlur}
                onKeyDown={onComboKeyDown}
            >
                {activeOption.title}
            </button>
            <Icon
                id="#select"
                classname="icon--select icon--gray-default select__ico"
                aria-hidden="true"
            />
            <div
                ref={listRef}
                id={listId}
                role="listbox"
                className={listClasses}
                aria-label={label}
                aria-multiselectable="false"
                tabIndex={-1}
            >
                {options.map((option, index) => (
                    /* eslint-disable jsx-a11y/click-events-have-key-events */
                    /* eslint-disable jsx-a11y/interactive-supports-focus */
                    <div
                        ref={(ref) => {
                            optionRefs.current[index] = ref;
                        }}
                        key={option.value}
                        id={getOptionId(index)}
                        role="option"
                        className={cn('select__item', index === focusedIndex && 'select__item--focused')}
                        aria-selected={index === activeIndex}
                        onClick={(event) => onOptionClick(event, index)}
                        onMouseDown={onOptionMouseDown}
                    >
                        <span className="select__item-text">
                            {option.title}
                        </span>
                        <Icon
                            id="#tick"
                            classname="icon icon--24 icon--green-default select__item-icon"
                            aria-hidden="true"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};
