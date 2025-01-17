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

import { type KeyboardEvent as ReactKeyboardEvent } from 'react';

/**
 * Option of a select.
 */
export type SelectOption = {
    /**
     * Option value.
     */
    value: string,

    /**
     * Option title.
     */
    title: string,
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
 * Filter an array of options against an input string.
 * Returns an array of options that begin with the filter string, case-independent.
 *
 * @param options Options to filter.
 * @param filter Filter string.
 * @returns Filtered options.
 */
function filterOptions(
    options: SelectOption[],
    filter: string,
): SelectOption[] {
    const filterLower = filter.toLowerCase();
    return options.filter(({ title }) => title.toLowerCase().startsWith(filterLower));
}

/**
 * Map a key press to an action.
 *
 * @param event Event.
 * @param selectHidden Is select hidden.
 * @returns Select action to perform.
 */
export function getActionFromKey(
    event: ReactKeyboardEvent<HTMLElement>,
    selectHidden: boolean,
): SelectAction {
    const {
        key,
        altKey,
        ctrlKey,
        metaKey,
    } = event;

    // all keys that will do the default open action
    const openKeys = ['ArrowDown', 'ArrowUp', 'Enter', ' '];

    // handle opening when closed
    if (selectHidden && openKeys.includes(key)) {
        return SelectAction.Open;
    }

    // home and end move the selected option when open or closed
    if (key === 'Home') {
        return SelectAction.First;
    }
    if (key === 'End') {
        return SelectAction.Last;
    }

    // handle typing characters when open or closed
    if (
        key === 'Backspace'
        || key === 'Clear'
        || (key.length === 1 && key !== ' ' && !altKey && !ctrlKey && !metaKey)
    ) {
        return SelectAction.Type;
    }

    // handle keys when open
    if (!selectHidden) {
        let action: SelectAction = SelectAction.None;

        if (key === 'ArrowUp' && altKey) {
            action = SelectAction.Select;
        } else if (key === 'ArrowDown' && !altKey) {
            action = SelectAction.Next;
        } else if (key === 'ArrowUp') {
            action = SelectAction.Previous;
        } else if (key === 'PageUp') {
            action = SelectAction.PageUp;
        } else if (key === 'PageDown') {
            action = SelectAction.PageDown;
        } else if (key === 'Escape') {
            action = SelectAction.Close;
        } else if (key === 'Enter' || key === ' ') {
            action = SelectAction.Select;
        }

        return action;
    }

    return SelectAction.None;
}

/**
 * Check if all characters in an string are the same.
 *
 * @param str String to check.
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
