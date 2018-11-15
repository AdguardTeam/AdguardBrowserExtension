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

/* global contentPage, HTMLDocument */

(function () {
    if (window !== window.top) {
        return;
    }

    if (!(document instanceof HTMLDocument)) {
        return;
    }

    /**
     * On extension startup contentPage is undefined
     */
    if (typeof contentPage === 'undefined') {
        return;
    }

    function htmlToElement(html) {
        let template = document.createElement('template');
        template.innerHTML = html;
        return template.content.firstChild;
    }

    /**
     * Determines maximum z-index of elements on the page and returns maximum + 1
     * @returns {String}
     */
    const findNextMaxZIndex = () => {
        const elements = Array.from(document.querySelectorAll('body *'));
        const zIndexes = elements
            .map(element => {
                const style = getComputedStyle(element);
                return Number(style.zIndex);
            })
            .filter(zIndex => !Number.isNaN(zIndex));
        const maxZIndex = Math.max(...zIndexes);
        return (maxZIndex + 1).toString();
    };

    /**
     * Shows alert popup.
     * Popup content is added right to the page content.
     *
     * @param message Message text
     */
    function showAlertPopup(message) {
        const { text, title } = message;

        let messages = [];
        if (Array.isArray(text)) {
            messages = text;
        } else {
            messages = [text];
        }

        // TODO remove if it is not necessary
        let fullText = '';
        for (let i = 0; i < messages.length; i += 1) {
            if (i > 0) {
                fullText += ', ';
            }
            fullText += messages[i];
        }

        const alertDivHtml = `<div class="adguard-popup-alert adguard-popup-alert--active">
                    <div class="adguard-popup-alert__in">
                        <div class="adguard-popup-subtitle-2">
                            ${title}
                        </div>
                    </div>
                </div>`;


        const appendIframe = (target, html) => {
            const iframe = document.createElement('iframe');
            target.insertAdjacentElement('afterbegin', iframe);
            iframe.src = 'about:blank';
            iframe.classList.add('adguard-iframe-popup-alert');
            iframe.contentWindow.document.open();
            iframe.contentWindow.document.write(html);
            iframe.contentWindow.document.close();
            iframe.style.zIndex = findNextMaxZIndex();
            return iframe;
        };

        const triesCount = 10;

        function appendPopup(count) {
            if (count >= triesCount) {
                return;
            }

            if (document.body) {
                const iframe = appendIframe(document.body, alertDivHtml);
                setTimeout(function () {
                    if (iframe && iframe.parentNode) {
                        iframe.parentNode.removeChild(iframe);
                    }
                }, 4000);
            } else {
                setTimeout(function () {
                    appendPopup(count + 1);
                }, 500);
            }
        }

        appendPopup(0);
    }

    /**
     * Shows version updated popup.
     * Popup content is added right to the page content.
     *
     * @param {{title,description, changelogHref, changelogText, offer, offerButtonHref, offerButtonText}} message
     */
    function showVersionUpdatedPopup(message) {
        const alertDivHtml = `<div id="adguard-new-version-popup" class="adguard-update-popup adguard-update-popup--active">
                <div id="adguard-new-version-popup-close" class="adguard-update-popup__close"></div>
                <div class="adguard-update-popup__logo"></div>
                <div class="adguard-update-popup__title">
                    ${message.title}
                </div>
                <div class="adguard-update-popup__desc">
                    ${message.description}
                </div>
                <a href="${message.changelogHref}" class="adguard-update-popup__link" target="_blank">
                    ${message.changelogText}
                </a>
                <div class="adguard-update-popup__offer">
                    ${message.offer}
                </div>
                <a href="${message.offerButtonHref}" class="adguard-update-popup__btn">
                    ${message.offerButtonText}
                </a>
            </div>`;

        let triesCount = 10;

        let alertDiv = htmlToElement(alertDivHtml);

        function appendPopup(count) {
            if (count >= triesCount) {
                return;
            }
            if (document.body) {
                document.body.appendChild(alertDiv);

                let close = document.getElementById('adguard-new-version-popup-close');
                close.addEventListener('click', function () {
                    document.body.removeChild(alertDiv);
                });
            } else {
                setTimeout(function () {
                    appendPopup(count + 1);
                }, 500);
            }
        }

        appendPopup(0);
    }

    /**
     * Reload page without cache
     */
    function noCacheReload() {
        let xhr = new XMLHttpRequest();
        xhr.open('GET', document.location.href);
        xhr.setRequestHeader('Pragma', 'no-cache');
        xhr.setRequestHeader('Expires', '-1');
        xhr.setRequestHeader('Expires', 'no-cache');
        xhr.onload = xhr.onerror = xhr.onabort = xhr.ontimeout = function () {
            document.location.reload(true);
        };
        xhr.send(null);
    }

    contentPage.onMessage.addListener(function (message) {
        if (message.type === 'show-alert-popup') {
            showAlertPopup(message);
        } else if (message.type === 'show-version-updated-popup') {
            showVersionUpdatedPopup(message);
        } else if (message.type === 'no-cache-reload') {
            noCacheReload();
        } else if (message.type === 'update-tab-url') {
            window.location = message.url;
        }
    });
})();
