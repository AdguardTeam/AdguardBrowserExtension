/**
 * This file is part of Adguard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * Adguard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Adguard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Adguard Browser Extension.  If not, see <http://www.gnu.org/licenses/>.
 */

/* global HTMLDocument, contentPage */

(function () {
    if (!(document instanceof HTMLDocument)) {
        return;
    }

    const getSubscriptionParams = (urlParams) => {
        let title = null;
        let url = null;

        for (let i = 0; i < urlParams.length; i += 1) {
            const parts = urlParams[i].split('=', 2);
            if (parts.length !== 2) {
                continue;
            }
            switch (parts[0]) {
                case 'title':
                case 'amp;title': // filterlists.com uses this url parameter
                    title = decodeURIComponent(parts[1]);
                    break;
                case 'location':
                    url = decodeURIComponent(parts[1]);
                    break;
                default:
                    break;
            }
        }

        return {
            title: title,
            url: url,
        };
    };

    const onLinkClicked = function (e) {
        if (e.button === 2) {
            // ignore right-click
            return;
        }

        let target = e.target;
        while (target) {
            if (target instanceof HTMLAnchorElement) {
                break;
            }
            target = target.parentNode;
        }

        if (!target) {
            return;
        }

        if (target.protocol === 'http:' || target.protocol === 'https:') {
            if (target.host !== 'subscribe.adblockplus.org' || target.pathname !== '/') {
                return;
            }
        } else if (!/^abp:\/*subscribe\/*\?/i.test(target.href)) {
            return;
        }

        e.preventDefault();
        e.stopPropagation();

        let urlParams;
        if (target.search) {
            urlParams = target.search.substring(1).split('&');
        } else {
            const href = target.href;
            const index = href.indexOf('?');
            urlParams = href.substring(index + 1).split('&');
        }

        const subParams = getSubscriptionParams(urlParams);
        const url = (subParams.url).trim();
        const title = (subParams.title || url).trim();

        if (!url) {
            return;
        }

        contentPage.sendMessage({
            type: 'addFilterSubscription',
            url: url,
            title: title,
        });
    };

    document.addEventListener('click', onLinkClicked);
})();
