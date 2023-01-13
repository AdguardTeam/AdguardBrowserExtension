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

import { MessageType, sendMessage } from '../common/messages';

export type SubscriptionData = {
    url: string,
    title: string,
};

/**
 * This content script used to subscribe to filters clicking to links with specified format
 */
export class Subscribe {
    /**
     * Add listener for subscription links in document
     */
    public static init(): void {
        if (!(document instanceof Document)) {
            return;
        }

        document.addEventListener('click', Subscribe.handleOnClickEvent);
    }

    /**
     * If event is subscription link click, intercepts it and sends
     * {@link MessageType.AddFilteringSubscription} message to background, else pass event.
     *
     * @param event - document mouse event
     */
    private static handleOnClickEvent(event: MouseEvent): void {
        // ignore right-click
        if (event.button === 2) {
            return;
        }

        const target = Subscribe.getAnchorElement(event);

        if (!target || !Subscribe.hasSubscriptionLink(target)) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        const data = Subscribe.getSubscriptionData(target);

        if (!data) {
            return;
        }

        sendMessage({
            type: MessageType.AddFilteringSubscription,
            data,
        });
    }

    /**
     * If event target is anchor element, returns it, else search anchor in parent nodes.
     *
     * @param e - document mouse event
     * @returns anchor element or null, if target is not found
     */
    private static getAnchorElement(e: MouseEvent): HTMLAnchorElement | null {
        let element = e.target;

        while (element) {
            if (element instanceof HTMLAnchorElement) {
                break;
            }

            element = element instanceof Element ? element.parentNode : null;
        }

        return element;
    }

    /**
     * Checks if anchor element has subscription link
     *
     * @param element - anchor element
     * @returns true, if anchor element has subscription link, else returns false
     */
    private static hasSubscriptionLink(element: HTMLAnchorElement): boolean {
        const {
            host,
            protocol,
            pathname,
            href,
        } = element;

        if (protocol === 'http:' || protocol === 'https:') {
            return host === 'subscribe.adblockplus.org' && pathname === '/';
        }

        return /^abp:\/*subscribe\/*\?/i.test(href) || /^adguard:\/*subscribe\/*\?/i.test(href);
    }

    /**
     * Parses payload from query string of anchor element
     *
     * @param element - anchor element
     * @param element.search - link url query string
     * @returns subscription data payload
     */
    private static getSubscriptionData({ search }: HTMLAnchorElement): SubscriptionData | null {
        const params = new URLSearchParams(search);

        const url = params.get('location');
        const title = params.get('title');

        if (!url) {
            return null;
        }

        return {
            url: url.trim(),
            title: (title || url).trim(),
        };
    }
}
