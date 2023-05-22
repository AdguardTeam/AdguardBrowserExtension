/* eslint-disable max-len */
/**
 * This file is part of Adguard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * Adguard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Adguard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Adguard Browser Extension. If not, see <http://www.gnu.org/licenses/>.
 */

import { contentPage } from './content-script';
import { MESSAGE_TYPES } from '../common/constants';

export const contentUtils = (function () {
    const MAX_Z_INDEX = '2147483647';

    /**
     * Create style element with provided css
     * @param css
     * @returns {any | HTMLElement}
     */
    const createStyleElement = (css) => {
        const styleElement = document.createElement('style');
        styleElement.type = 'text/css';
        styleElement.appendChild(document.createTextNode(css));
        return styleElement;
    };

    /**
     * Creates iframe and appends it after target open tag
     * @param target Node where to append iframe with html
     * @param html html string to write inside iframe
     * @param alertStyles popup styles text
     * @returns {HTMLElement} iframe element
     */
    const appendIframe = (target, html, alertStyles) => {
        const styleElement = createStyleElement(alertStyles);
        const prependedHtml = `${styleElement.outerHTML}\n${html}`;

        const iframe = document.createElement('iframe');
        iframe.src = 'about:blank';
        iframe.style.position = 'fixed';
        iframe.style.zIndex = MAX_Z_INDEX;
        iframe.srcdoc = prependedHtml;
        target.insertAdjacentElement('afterbegin', iframe);

        return iframe;
    };

    /**
     * Creates div and appends it to the page
     * @param target
     * @param html
     * @returns {any | HTMLElement}
     */
    const appendDiv = (target, html) => {
        const div = document.createElement('div');
        div.innerHTML = html;
        target.insertAdjacentElement('afterbegin', div);
        div.style.zIndex = MAX_Z_INDEX;
        return div;
    };

    /**
     * If isAdguardTab we append div, else we append iframe
     * @param target
     * @param html
     * @param isAdguardTab
     * @param alertStyles
     * @param alertContainerStyles
     * @returns {HTMLElement}
     */
    const appendAlertElement = (target, html, isAdguardTab, alertStyles, alertContainerStyles) => {
        const alertContainerElement = createStyleElement(alertContainerStyles);
        document.body.insertAdjacentElement('afterbegin', alertContainerElement);
        if (isAdguardTab) {
            return appendDiv(target, html);
        }

        return appendIframe(target, html, alertStyles);
    };

    /**
     * Generates alert html
     * @param {string} title
     * @param {string} text
     * @returns {string}
     */
    const genAlertHtml = (title, text) => {
        let descBlock = '';
        if (text && text.length > 0) {
            descBlock = `<div class="adguard-popup-alert__desc">
                            ${text}
                        </div>`;
        }

        // don't show description text if it is same as title or if it is equal to undefined
        if (title === text || text === 'undefined') {
            descBlock = '';
        }

        let titleBlock = '';
        if (title && title.length > 0) {
            titleBlock = `<div class="adguard-popup-alert__title">
                            ${title}
                        </div>`;
        }

        return `<div class="adguard-popup-alert">
                    ${titleBlock}
                    ${descBlock}
                </div>`;
    };

    /**
     * Shows alert popup.
     * Popup content is added right to the page content.
     *
     * @param message Message text
     */
    function showAlertPopup(message) {
        const {
            text,
            title,
            isAdguardTab,
            alertStyles,
            alertContainerStyles,
        } = message;

        if (!title && !text) {
            return;
        }

        let messages = [];
        if (Array.isArray(text)) {
            messages = text;
        } else {
            messages = [text];
        }

        let fullText = '';
        for (let i = 0; i < messages.length; i += 1) {
            if (i > 0) {
                fullText += ', ';
            }
            fullText += messages[i];
        }

        const alertDivHtml = genAlertHtml(title, fullText);

        const triesCount = 10;

        function appendPopup(count) {
            if (count >= triesCount) {
                return;
            }

            if (document.body) {
                const alertElement = appendAlertElement(
                    document.body,
                    alertDivHtml,
                    isAdguardTab,
                    alertStyles,
                    alertContainerStyles,
                );
                alertElement.classList.add('adguard-alert-iframe');
                alertElement.onload = () => {
                    alertElement.style.visibility = 'visible';
                };
                setTimeout(() => {
                    if (alertElement && alertElement.parentNode) {
                        alertElement.parentNode.removeChild(alertElement);
                    }
                }, 4000);
            } else {
                setTimeout(() => {
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
     * @param {{title,description, changelogHref, changelogText, offer, offerDesc, offerButtonHref, offerButtonText}} message
     */
    function showVersionUpdatedPopup(message) {
        const {
            title,
            offer,
            description,
            isAdguardTab,
            changelogHref,
            changelogText,
            offerButtonHref,
            offerButtonText,
            showPromoNotification,
            disableNotificationText,
            alertStyles,
            updateIframeStyles,
        } = message;

        const updateIframeHtml = `
                            <div id="adguard-new-version-popup" class="adguard-update-popup adguard-update-popup--active${showPromoNotification ? ' adguard-update-popup--promo' : ''}">
                                <div id="adguard-new-version-popup-close" class="adguard-update-popup__close close-iframe"></div>
                                <div class="adguard-update-popup__logo"></div>
                                <div class="adguard-update-popup__title">
                                    ${title}
                                </div>
                                <div class="adguard-update-popup__desc">
                                    ${description}
                                </div>
                                <div class="adguard-update-popup__links">
                                    <a href="${changelogHref}" class="adguard-update-popup__link close-iframe" target="_blank">
                                        ${changelogText}
                                    </a>
                                    <a href="#" class="adguard-update-popup__link adguard-update-popup__link--disable close-iframe disable-notifications">
                                        ${disableNotificationText}
                                    </a>
                                </div>
                                <div class="adguard-update-popup__offer${showPromoNotification ? ' adguard-update-popup__offer--show' : ''}">
                                    <div class="adguard-update-popup__offer-close close-iframe set-notification-viewed"></div>
                                    <div class="adguard-update-popup__offer-content">
                                        <div class="adguard-update-popup__offer-title">
                                            ${offer}
                                        </div>
                                        <a href="${offerButtonHref}" class="adguard-update-popup__btn close-iframe set-notification-viewed${showPromoNotification ? ' adguard-update-popup__btn--promo' : ''}" target="_blank">
                                            ${offerButtonText}
                                        </a>
                                    </div>
                                </div>
                            </div>`;

        const triesCount = 10;

        const handleCloseIframe = (iframe) => {
            const iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
            const closeElements = iframeDocument.querySelectorAll('.close-iframe');
            if (closeElements.length > 0) {
                closeElements.forEach((element) => {
                    element.addEventListener('click', () => {
                        if (element.classList.contains('disable-notifications')) {
                            // disable update notifications
                            contentPage.sendMessage({
                                type: MESSAGE_TYPES.CHANGE_USER_SETTING,
                                key: 'show-app-updated-disabled',
                                value: true,
                            });
                        }
                        if (showPromoNotification
                            && element.classList.contains('set-notification-viewed')) {
                            contentPage.sendMessage({
                                type: 'setNotificationViewed',
                                withDelay: false,
                            });
                            const promoNotification = iframeDocument.querySelector('.adguard-update-popup__offer');
                            if (promoNotification) {
                                promoNotification.parentNode.removeChild(promoNotification);
                            }
                            return;
                        }
                        // Remove iframe after click event fire on link
                        // NOTICE: if here is used value equal to 0,
                        // then iframe is closed early than link is clicked
                        const REMOVE_FRAMEWORK_TIMEOUT_MS = 10;
                        setTimeout(() => {
                            iframe.parentNode.removeChild(iframe);
                        }, REMOVE_FRAMEWORK_TIMEOUT_MS);
                    });
                });
                return true;
            }
            return false;
        };

        function appendPopup(count) {
            if (count >= triesCount) {
                return;
            }

            if (document.body && !isAdguardTab) {
                const updateIframeCss = createStyleElement(updateIframeStyles);
                document.body.insertAdjacentElement('afterbegin', updateIframeCss);

                const iframe = appendIframe(document.body, updateIframeHtml, alertStyles);
                iframe.classList.add('adguard-update-iframe');
                const isListening = handleCloseIframe(iframe);
                if (!isListening) {
                    iframe.addEventListener('load', () => {
                        handleCloseIframe(iframe);
                    });
                }
            } else {
                setTimeout(() => {
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
        const xhr = new XMLHttpRequest();
        xhr.open('GET', document.location.href);
        xhr.setRequestHeader('Pragma', 'no-cache');
        xhr.setRequestHeader('Expires', '-1');
        xhr.setRequestHeader('Expires', 'no-cache');

        const reload = () => {
            document.location.reload(true);
        };

        xhr.onload = reload;
        xhr.onerror = reload;
        xhr.onabort = reload;
        xhr.send(null);
    }

    const init = () => {
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

        contentPage.onMessage.addListener((message, sender, sendResponse) => {
            if (message.type === 'show-alert-popup') {
                showAlertPopup(message);
            } else if (message.type === 'show-version-updated-popup') {
                showVersionUpdatedPopup(message);
                sendResponse(true);
            } else if (message.type === 'no-cache-reload') {
                noCacheReload();
            } else if (message.type === 'update-tab-url') {
                window.location = message.url;
            }
        });
    };

    return {
        init,
    };
})();
