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
import { Alerts, AppendAlertElementProps } from './alerts';
import {
    ShowAlertPopupMessage,
    ShowVersionUpdatedPopupMessage,
    sendMessage,
    MessageType,
} from '../../common/messages';
import { Elements } from './elements';
// !Important! Direct import to avoid side effects on tree shaking.
import { SettingOption } from '../../background/schema/settings';

// target always is document
export type AppendAlertPopupProps = Omit<AppendAlertElementProps, 'target'>;

export type AppendVersionUpdatedPopupProps = {
    // content css string
    alertStyles: string,
    // iframe container html string
    iframeHtml: string,
    // iframe container css string
    iframeStyles: string,
    // Is Adguard tab
    isAdguardTab: boolean,
    // Is we need to show promo notification
    showPromoNotification: boolean,
};

/**
 * Helper class for creating and injecting info popups
 */
export class Popups {
    private static triesCount = 10;

    private static hideTimeoutMs = 4000;

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
            </div>
        `;
        /* eslint-enable max-len */

        Popups.appendVersionUpdatedPopup(0, {
            iframeHtml,
            iframeStyles,
            alertStyles,
            isAdguardTab,
            showPromoNotification,
        });

        return true;
    }

    /**
     * Appends alert popup to page
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
            }, Popups.hideTimeoutMs);
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
     * Appends version update popup to page
     *
     * @param count - try count
     * @param props - {@link AppendVersionUpdatedPopupProps}
     */
    private static appendVersionUpdatedPopup(
        count: number,
        props: AppendVersionUpdatedPopupProps,
    ): void {
        if (count >= Popups.triesCount) {
            return;
        }

        const {
            isAdguardTab,
            showPromoNotification,
            iframeStyles,
            iframeHtml,
            alertStyles,
        } = props;

        if (document.body && !isAdguardTab) {
            const iframeCss = Elements.createStyleElement(iframeStyles);
            document.body.insertAdjacentElement('afterbegin', iframeCss);

            const iframe = Elements.appendIframe({
                target: document.body,
                html: iframeHtml,
                styles: alertStyles,
            });

            iframe.classList.add('adguard-update-iframe');

            const isListening = Popups.handleCloseIframe(iframe, showPromoNotification);
            if (!isListening) {
                iframe.addEventListener('load', () => {
                    Popups.handleCloseIframe(iframe, showPromoNotification);
                });
            }
        } else {
            setTimeout(() => {
                Popups.appendVersionUpdatedPopup(count + 1, props);
            }, 500);
        }
    }

    /**
     * Handle manual close of iframe popup
     *
     * @param iframe - iframe element
     * @param showPromoNotification - notification show flag
     *
     * @returns true if iframe is closed, else returns false
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

        if (closeElements.length > 0) {
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
                    if (showPromoNotification && element.classList.contains('set-notification-viewed')) {
                        sendMessage({
                            type: MessageType.SetNotificationViewed,
                            data: {
                                withDelay: false,
                            },
                        });
                    }

                    setTimeout(() => {
                        iframe.parentNode?.removeChild(iframe);
                    }, Popups.removeFrameTimeoutMs);
                });
            });
            return true;
        }
        return false;
    }
}
