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

    function onCheckSubscriptionUrlResponse(url, confirmText) {

        if (!confirm(confirmText)) {
            return;
        }

        contentPage.sendMessage({
            type: 'enableSubscription',
            url: url
        }, function (response) {
            var message = {title: response.title, text: response.text};
            showAlertPopupMessage(message);
        });
    }

    function getSubscriptionParams(urlParams) {

        var title = null;
        var url = null;

        for (var i = 0; i < urlParams.length; i++) {
            var parts = urlParams[i].split("=", 2);
            if (parts.length != 2) {
                continue;
            }
            switch (parts[0]) {
                case 'title':
                    title = decodeURIComponent(parts[1]);
                    break;
                case 'location':
                    url = decodeURIComponent(parts[1]);
                    break;
            }
        }

        return {
            title: title,
            url: url
        }
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

        if (!target) {
            return;
        }

        if (target.protocol === 'http:' || target.protocol == 'https:') {
            if (target.host !== 'subscribe.adblockplus.org' || target.pathname !== '/') {
                return;
            }
        } else if (!/^abp:\/*subscribe\/*\?/i.test(target.href)) {
            return;
        }

        e.preventDefault();
        e.stopPropagation();

        var urlParams;
        if (target.search) {
            urlParams = target.search.substring(1).split('&');
        } else {
            var href = target.href;
            var index = href.indexOf('?');
            urlParams = href.substring(index + 1).split('&');
        }

        var subParams = getSubscriptionParams(urlParams);
        var url = subParams.url;
        var title = subParams.title || url;

        if (!url) {
            return;
        }

        contentPage.sendMessage({
            type: 'checkSubscriptionUrl',
            url: url.trim(),
            title: title.trim()
        }, function (response) {
            onCheckSubscriptionUrlResponse(url, response.confirmText);
        });
    };

    document.addEventListener('click', onLinkClicked);

})();