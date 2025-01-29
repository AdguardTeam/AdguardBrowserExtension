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

/**
 * Retrieves first non-disabled element from parent element
 *
 * @param parent Parent element to search for elements
 * @param selector Selector elements
 * @returns First non-disabled element or null if not found
 */
export function getFirstNonDisabledElement(
    parent: HTMLElement,
    selector: string,
): HTMLElement | null {
    const elements = parent.querySelectorAll(selector);

    // focus on first non-disabled element
    for (let i = 0; i < elements.length; i += 1) {
        const element = elements[i];

        if (
            element instanceof HTMLElement
            && (!('disabled' in element) || !element.disabled)
        ) {
            element.focus();
            return element;
        }
    }

    return null;
}
