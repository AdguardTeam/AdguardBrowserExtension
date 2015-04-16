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

(function () {

    if (!(document instanceof HTMLDocument)) {
        return;
    }

    function onCheckSubscriptionUrlResponse(response) {

        if (!confirm(response.confirmText)) {
            return;
        }

        ext.backgroundPage.sendMessage({
            type: 'enable-subscription',
            url: response.url
        });
    }

    var onLinkClicked = function (e) {

        if (e.button === 2) {
            //ignore right-click
            return;
        }

        var target = e.target;
        while (target) {
            if (target instanceof HTMLAnchorElement) {
                break;
            }
            target = target.parentNode;
        }

        if (!target || target.protocol != 'abp:') {
            return;
        }

        var matches = /^abp:\/*subscribe\/*\?location=([^&]+).*title=([^&]+)/.exec(target.href);
        if (matches === null) {
            return;
        }

        var url = decodeURIComponent(matches[1]);
        var title = decodeURIComponent(matches[2]) || url;

        if (!url) {
            return;
        }

        e.preventDefault();
        e.stopPropagation();

        ext.backgroundPage.sendMessage({
            type: 'check-subscription-url',
            url: url,
            title: title
        }, onCheckSubscriptionUrlResponse);
    };

    document.addEventListener('click', onLinkClicked);

})();