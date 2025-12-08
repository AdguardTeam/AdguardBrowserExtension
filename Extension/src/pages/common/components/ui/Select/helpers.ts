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

import { type KeyboardEvent as ReactKeyboardEvent } from 'react';

/**
 * Option of a select.
 */
export type SelectOption = {
    /**
     * Option value.
     */
    value: string;

    /**
     * Option title.
     */
    title: string;
};

/**
 * Select action.
 */
export enum SelectAction {
    Close,
    Select,
    First,
    Last,
    Next,
    Open,
    PageDown,
    PageUp,
    Previous,
    Type,
    None,
}

/**
 * Keyboard keys supported by the select.
 */
export enum SelectKey {
    Enter = 'Enter',
    Space = ' ',
    Escape = 'Escape',
    ArrowDown = 'ArrowDown',
    ArrowUp = 'ArrowUp',
    Home = 'Home',
    End = 'End',
    PageUp = 'PageUp',
    PageDown = 'PageDown',
    Backspace = 'Backspace',
    Clear = 'Clear',
    Character = 'Character',
}

/**
 * Map a key press to an action.
 */
const SELECT_KEY_TO_ACTION_MAP = new Map<SelectKey, SelectAction>([
    [SelectKey.Home, SelectAction.First],
    [SelectKey.End, SelectAction.Last],
    [SelectKey.Backspace, SelectAction.Type],
    [SelectKey.Clear, SelectAction.Type],
    [SelectKey.Character, SelectAction.Type],
]);

/**
 * Map a key press to an action when the select is closed.
 */
const SELECT_CLOSED_KEY_TO_ACTION_MAP = new Map<SelectKey, SelectAction>([
    ...SELECT_KEY_TO_ACTION_MAP.entries(),
    [SelectKey.ArrowDown, SelectAction.Open],
    [SelectKey.ArrowUp, SelectAction.Open],
    [SelectKey.Enter, SelectAction.Open],
    [SelectKey.Space, SelectAction.Open],
]);

/**
 * Map a key press to an action when the select is open.
 */
const SELECT_OPENED_KEY_TO_ACTION_MAP = new Map<SelectKey, SelectAction>([
    ...SELECT_KEY_TO_ACTION_MAP.entries(),
    [SelectKey.ArrowDown, SelectAction.Next],
    [SelectKey.ArrowUp, SelectAction.Previous],
    [SelectKey.PageUp, SelectAction.PageUp],
    [SelectKey.PageDown, SelectAction.PageDown],
    [SelectKey.Escape, SelectAction.Close],
    [SelectKey.Enter, SelectAction.Select],
    [SelectKey.Space, SelectAction.Select],
]);

/**
 * Filter an array of options against an input string by using `option.title` property.
 * The filter is case-insensitive and will match any option that starts with or contains the filter string.
 * Filtering prioritizes:
 * 1) Options that starts with filter string.
 * 2) Options that contains filter string.
 *
 * @param options Options to filter.
 * @param filter Filter string.
 *
 * @returns Filtered options.
 */
function filterOptions(
    options: SelectOption[],
    filter: string,
): SelectOption[] {
    const filterLower = filter.toLowerCase();
    const startsWith: SelectOption[] = [];
    const contains: SelectOption[] = [];

    options.forEach((option) => {
        const titleLower = option.title.toLowerCase();

        if (titleLower.startsWith(filterLower)) {
            startsWith.push(option);
        } else if (titleLower.includes(filterLower)) {
            contains.push(option);
        }
    });

    return [...startsWith, ...contains];
}

/**
 * Get the select key from a keyboard event.
 *
 * @param event Keyboard event.
 *
 * @returns Select key.
 */
function getSelectKeyFromEvent(event: ReactKeyboardEvent<HTMLElement>): SelectKey | null {
    const {
        key,
        altKey,
        ctrlKey,
        metaKey,
    } = event;

    // get matching key from enum, 'Character' not overlaps with any native key
    if (Object.values(SelectKey).includes(key as SelectKey)) {
        return key as SelectKey;
    }

    // check if key is a single character
    if (key.length === 1 && key !== ' ' && !altKey && !ctrlKey && !metaKey) {
        return SelectKey.Character;
    }

    return null;
}

/**
 * Map a key press to an action.
 *
 * @see {@link https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-select-only/ | Specs}
 *
 * @param event Event.
 * @param selectHidden Is select hidden.
 *
 * @returns Select action to perform.
 */
export function getActionFromKey(
    event: ReactKeyboardEvent<HTMLElement>,
    selectHidden: boolean,
): SelectAction {
    const selectKey = getSelectKeyFromEvent(event);

    // if key is not supported, do nothing
    if (!selectKey) {
        return SelectAction.None;
    }

    // Special case: ArrowUp + Alt updates select value
    if (!selectHidden && selectKey === SelectKey.ArrowUp && event.altKey) {
        return SelectAction.Select;
    }

    // get action map based on select visibility
    const map = selectHidden
        ? SELECT_CLOSED_KEY_TO_ACTION_MAP
        : SELECT_OPENED_KEY_TO_ACTION_MAP;

    return map.get(selectKey) ?? SelectAction.None;
}

/**
 * Check if all characters in an string are the same.
 *
 * @param str String to check.
 *
 * @returns True if all letters are the same.
 */
function areAllLettersSame(str: string): boolean {
    const array = str.split('');
    return array.every((letter) => letter === array[0]);
}

/**
 * Return the index of an option from an array of options, based on a search string.
 * If the filter is multiple iterations of the same letter (e.g "aaa"),
 * then cycle through first-letter matches.
 *
 * @param options Options to filter.
 * @param filter Filter string.
 * @param startIndex Start index.
 *
 * @returns Index of the option.
 */
export function getIndexByLetter(
    options: SelectOption[],
    filter: string,
    startIndex = 0,
) {
    if (filter === '') {
        return -1;
    }

    const orderedOptions = [
        ...options.slice(startIndex),
        ...options.slice(0, startIndex),
    ];
    const firstMatch = filterOptions(orderedOptions, filter)[0];

    // first check if there is an exact match for the typed string
    if (firstMatch) {
        return options.indexOf(firstMatch);
    }

    // if the same letter is being repeated, cycle through first-letter matches
    if (areAllLettersSame(filter)) {
        const firstMatchByLetter = filterOptions(orderedOptions, filter[0] ?? '')[0];
        if (!firstMatchByLetter) {
            return -1;
        }

        return options.findIndex(({ title }) => title === firstMatchByLetter.title);
    }

    // if no matches, return -1
    return -1;
}

/**
 * Get an updated option index after performing an action.
 *
 * @param currentIndex Current index.
 * @param maxIndex Maximum index.
 * @param action Action to perform.
 * @param pageSize Page size.
 *
 * @returns Updated index.
 */
export function getUpdatedIndex(
    currentIndex: number,
    maxIndex: number,
    action: SelectAction,
    pageSize = 4,
) {
    switch (action) {
        case SelectAction.First:
            return 0;
        case SelectAction.Last:
            return maxIndex;
        case SelectAction.Previous:
            return Math.max(0, currentIndex - 1);
        case SelectAction.Next:
            return Math.min(maxIndex, currentIndex + 1);
        case SelectAction.PageUp:
            return Math.max(0, currentIndex - pageSize);
        case SelectAction.PageDown:
            return Math.min(maxIndex, currentIndex + pageSize);
        default:
            return currentIndex;
    }
}

/**
 * Check if element is visible in browser view port.
 *
 * @param element Element to check.
 *
 * @returns True if element is visible.
 */
export function isElementInView(element: HTMLElement) {
    const bounding = element.getBoundingClientRect();

    return (
        bounding.top >= 0
        && bounding.left >= 0
        && bounding.bottom <= (window.innerHeight || document.documentElement.clientHeight)
        && bounding.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

/**
 * Check if an element is currently scrollable.
 *
 * @param element Element to check.
 *
 * @returns True if element is scrollable.
 */
export function isScrollable(element: HTMLElement) {
    return element && element.clientHeight < element.scrollHeight;
}

/**
 * Ensure a given child element is within the parent's visible scroll area.
 * If the child is not visible, scroll the parent.
 *
 * @param activeElement
 * @param scrollParent
 */
export function maintainScrollVisibility(
    activeElement: HTMLElement,
    scrollParent: HTMLElement,
) {
    const { offsetHeight, offsetTop } = activeElement;
    const { offsetHeight: parentOffsetHeight, scrollTop } = scrollParent;

    const isAbove = offsetTop < scrollTop;
    const isBelow = offsetTop + offsetHeight > scrollTop + parentOffsetHeight;

    if (isAbove) {
        scrollParent.scrollTo(0, offsetTop);
    } else if (isBelow) {
        scrollParent.scrollTo(0, offsetTop - parentOffsetHeight + offsetHeight);
    }
}
