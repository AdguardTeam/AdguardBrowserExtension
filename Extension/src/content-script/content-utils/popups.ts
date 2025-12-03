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
import {
    type ShowAlertPopupMessage,
    type ShowVersionUpdatedPopupMessage,
    type ShowRuleLimitsAlertMessage,
    sendMessage,
    MessageType,
} from '../../common/messages';
import { SettingOption } from '../../background/schema/settings/enum';

import { Alerts, type AppendAlertElementProps } from './alerts';
import { Elements } from './elements';

// !Important! Direct import to avoid side effects on tree shaking.

// target always is document
export type AppendAlertPopupProps = Omit<AppendAlertElementProps, 'target'>;

export type AppendPopupProps = {
    /**
     * Content css string.
     */
    alertStyles: string;

    /**
     * Iframe container html string.
     */
    iframeHtml: string;

    /**
     * Iframe container css string.
     */
    iframeStyles: string;

    /**
     * Iframe container css class name.
     */
    iframeClassName: string;

    /**
     * Is Adguard tab.
     */
    isAdguardTab: boolean;

    /**
     * Should show promo notification.
     */
    showPromoNotification: boolean;

    /**
     * Callback to execute after iframe is injected.
     *
     * @param iframe Iframe element.
     */
    onIframeInjected?: (iframe: HTMLIFrameElement) => void;
};

/**
 * Helper class for creating and injecting info popups
 */
export class Popups {
    private static triesCount = 10;

    /**
     * Time to live for alert popup.
     */
    private static HIDE_TIMEOUT_MS = 1000 * 4;

    private static retryTimeoutMs = 500;

    // Remove iframe after click event fire on link
    // NOTICE: if here is used value equal to 0,
    // then iframe is closed early than link is clicked
    private static removeFrameTimeoutMs = 10;

    /**
     * Shows alert popup.
     * Popup content is added right to the page content.
     *
     * @param message - {@link ShowAlertPopupMessage}
     * @param message.data - {@link ShowAlertPopupMessage} payload
     */
    public static showAlertPopup({ data }: ShowAlertPopupMessage): void {
        const {
            text,
            title,
            isAdguardTab,
            alertStyles,
            alertContainerStyles,
        } = data;

        if (!title && !text) {
            return;
        }

        let messages: string[] = [];
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

        const html = Alerts.genAlertHtml({
            title,
            text: fullText,
        });

        Popups.appendAlertPopup(0, {
            html,
            isAdguardTab,
            alertStyles,
            alertContainerStyles,
        });
    }

    /**
     * Shows version updated popup.
     * Popup content is added right to the page content.
     *
     * @param message - {@link ShowVersionUpdatedPopupMessage}
     * @param message.data - {@link ShowVersionUpdatedPopupMessage} payload
     *
     * @returns execution flag
     */
    public static showVersionUpdatedPopup({ data }: ShowVersionUpdatedPopupMessage): boolean {
        const {
            title,
            offer,
            offerBgImage,
            description,
            isAdguardTab,
            changelogHref,
            changelogText,
            offerButtonHref,
            offerButtonText,
            showPromoNotification,
            disableNotificationText,
            alertStyles,
            iframeStyles,
        } = data;

        const offerStyle = offerBgImage
            ? `background-image: url('${offerBgImage}')`
            : '';

        /* eslint-disable max-len */
        const iframeHtml = `
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
                <div
                    class="adguard-update-popup__offer${showPromoNotification ? ' adguard-update-popup__offer--show' : ''}"
                    style="${offerStyle}"
                >
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
            </div>
        `;
        /* eslint-enable max-len */

        Popups.appendPopup(0, {
            iframeHtml,
            iframeStyles,
            iframeClassName: 'adguard-update-iframe',
            alertStyles,
            isAdguardTab,
            showPromoNotification,
        });

        return true;
    }

    /**
     * Shows rules limits exceeded message.
     *
     * @param message - {@link ShowRuleLimitsAlertMessage}
     * @param message.data - {@link ShowRuleLimitsAlertMessage} payload
     *
     * @returns execution flag
     */
    public static showRuleLimitsAlert({ data }: ShowRuleLimitsAlertMessage): boolean {
        const {
            isAdguardTab,
            mainText,
            linkText,
            alertStyles,
            alertContainerStyles,
        } = data;

        const iframeHtml = `
            <div id="adguard-rules-limits-exceeded-popup" class="adguard-rules-limits-exceeded-popup">
                <div class="adguard-rules-limits-exceeded-popup__info-icon"></div>
                <div class="adguard-rules-limits-exceeded-popup__content">
                    <p> ${mainText} </p>
                    <button id="open-rule-limits-link" type="button"> ${linkText} </button>
                </div>
                <button
                    aria-label="close"
                    type="button"
                    class="adguard-rules-limits-exceeded-popup__close close-iframe"
                ></button>
            </div>
        `;

        Popups.appendPopup(0, {
            iframeHtml,
            iframeStyles: alertContainerStyles,
            iframeClassName: 'adguard-rules-limits-exceeded-iframe',
            alertStyles,
            isAdguardTab,
            showPromoNotification: false,
            onIframeInjected: (iframe) => {
                const isListening = Popups.handleOpenRulesLimitsPage(iframe);
                if (!isListening) {
                    iframe.addEventListener('load', () => {
                        Popups.handleOpenRulesLimitsPage(iframe);
                    });
                }

                // iframe should be hidden after some time
                const removeTimeout = setTimeout(() => {
                    iframe.parentNode?.removeChild(iframe);
                }, Popups.HIDE_TIMEOUT_MS);

                /**
                 * Mouseover event listener:
                 * - clear timeout to prevent iframe from closing if user hovers over the iframe;
                 * - remove event listener after first hover.
                 */
                const focusListener = () => {
                    clearTimeout(removeTimeout);
                    iframe.removeEventListener('mouseover', focusListener);
                };

                iframe.addEventListener('mouseover', focusListener);
            },
        });

        return true;
    }

    /**
     * Appends alert popup to page.
     *
     * @param count - try count
     * @param props - {@link AppendAlertElementProps} with omitted target property
     */
    private static appendAlertPopup(
        count: number,
        props: AppendAlertPopupProps,
    ): void {
        if (count >= Popups.triesCount) {
            return;
        }

        if (document.body) {
            const alertElement = Alerts.appendAlertElement({
                ...props,
                target: document.body,
            });

            alertElement.classList.add('adguard-alert-iframe');
            alertElement.onload = () => {
                alertElement.style.visibility = 'visible';
            };
            setTimeout(() => {
                if (alertElement && alertElement.parentNode) {
                    alertElement.parentNode.removeChild(alertElement);
                }
            }, Popups.HIDE_TIMEOUT_MS);
        } else {
            setTimeout(() => {
                Popups.appendAlertPopup(
                    count + 1,
                    props,
                );
            }, Popups.retryTimeoutMs);
        }
    }

    /**
     * Appends version update popup to page.
     *
     * @param count - try count
     * @param props - {@link AppendVersionUpdatedPopupProps}
     */
    private static appendPopup(
        count: number,
        props: AppendPopupProps,
    ): void {
        if (count >= Popups.triesCount) {
            return;
        }

        const {
            isAdguardTab,
            showPromoNotification,
            iframeStyles,
            iframeClassName,
            iframeHtml,
            alertStyles,
            onIframeInjected,
        } = props;

        if (document.body && !isAdguardTab) {
            const iframeCss = Elements.createStyleElement(iframeStyles);
            document.body.insertAdjacentElement('afterbegin', iframeCss);

            const iframe = Elements.appendIframe({
                target: document.body,
                html: iframeHtml,
                styles: alertStyles,
            });

            iframe.classList.add(iframeClassName);

            const isListening = Popups.handleCloseIframe(iframe, showPromoNotification);
            if (!isListening) {
                iframe.addEventListener('load', () => {
                    Popups.handleCloseIframe(iframe, showPromoNotification);
                });
            }

            if (onIframeInjected) {
                onIframeInjected(iframe);
            }
        } else {
            setTimeout(() => {
                Popups.appendPopup(count + 1, props);
            }, 500);
        }
    }

    /**
     * Handle manual close of iframe popup.
     *
     * @param iframe - iframe element
     * @param showPromoNotification - notification show flag
     *
     * @returns True if registered click listener, false otherwise.
     */
    private static handleCloseIframe(
        iframe: HTMLIFrameElement,
        showPromoNotification: boolean,
    ): boolean {
        const iframeDocument = iframe.contentDocument || iframe.contentWindow?.document;

        if (!iframeDocument) {
            return false;
        }

        const closeElements = iframeDocument.querySelectorAll('.close-iframe');

        if (closeElements.length === 0) {
            return false;
        }
        closeElements.forEach((element) => {
            element.addEventListener('click', () => {
                if (element.classList.contains('disable-notifications')) {
                    // disable update notifications
                    sendMessage({
                        type: MessageType.ChangeUserSettings,
                        data: {
                            key: SettingOption.DisableShowAppUpdatedNotification,
                            value: true,
                        },
                    });
                }

                // Mark promo notification as viewed if it was shown
                if (showPromoNotification) {
                    sendMessage({
                        type: MessageType.SetNotificationViewed,
                        data: {
                            withDelay: false,
                        },
                    });
                }

                if (showPromoNotification && element.classList.contains('set-notification-viewed')) {
                    // close only promo notification, not whole iframe
                    const promoNotification = iframeDocument.querySelector('.adguard-update-popup__offer');
                    if (!promoNotification) {
                        return;
                    }

                    promoNotification.parentNode?.removeChild(promoNotification);
                    // eslint-disable-next-line max-len
                    const versionPopup: HTMLElement | null = iframeDocument.getElementById('adguard-new-version-popup');
                    if (versionPopup) {
                        // fix height of the frame
                        versionPopup.style.minHeight = '300px';
                    }

                    // Prevent closing the whole iframe
                    return;
                }

                setTimeout(() => {
                    iframe.parentNode?.removeChild(iframe);
                }, Popups.removeFrameTimeoutMs);
            });
        });

        return true;
    }

    /**
     * Handle open rules limits settings page.
     *
     * @param iframe - iframe element
     *
     * @returns True if registered click listener, false otherwise.
     */
    private static handleOpenRulesLimitsPage(iframe: HTMLIFrameElement): boolean {
        const iframeDocument = iframe.contentDocument || iframe.contentWindow?.document;

        if (!iframeDocument) {
            return false;
        }

        const link = iframeDocument.querySelector('#open-rule-limits-link');

        if (!link) {
            return false;
        }

        const clickHandler = () => {
            // Open rules limits settings page.
            sendMessage({ type: MessageType.OpenRulesLimitsTab });

            // After redirect to settings page, close iframe.
            const removeTimeout = setTimeout(() => {
                iframe.parentNode?.removeChild(iframe);
                clearTimeout(removeTimeout);
            }, Popups.removeFrameTimeoutMs);

            link.removeEventListener('click', clickHandler);
        };

        link.addEventListener('click', clickHandler);

        return true;
    }
}
