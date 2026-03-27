/**
 * Copyright (c) 2015-2026 Adguard Software Ltd.
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

/**
 * Registers a pointerdown listener on the document to intercept link clicks.
 * Shared initialisation logic for content scripts that handle custom protocol links
 * (e.g. `adguard:subscribe`, `adguard:import_user_configuration`).
 *
 * @param handler Pointer-down event handler to register.
 */
export function initLinkInterceptor(handler: (event: PointerEvent) => void): void {
    if (!(document instanceof Document)) {
        return;
    }

    document.addEventListener('pointerdown', handler);
}

/**
 * Walks up the DOM tree from the event target to find the nearest ancestor
 * {@link HTMLAnchorElement}.
 *
 * @param e Pointer event whose target to start from.
 *
 * @returns The nearest ancestor anchor element, or `null` if none is found.
 */
export function getAnchorElement(e: PointerEvent): HTMLAnchorElement | null {
    let element = e.target;

    while (element) {
        if (element instanceof HTMLAnchorElement) {
            break;
        }

        element = element instanceof Element ? element.parentNode : null;
    }

    return element;
}
