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
import { Elements } from './elements';

export type AppendAlertElementProps = {
    /**
     * Node where to append alert with html
     */
    target: Element,

    // Html string to write inside alert
    html: string,
    // Is adguard tab
    isAdguardTab: boolean,
    // Alert css
    alertStyles: string,
    // Alert container css
    alertContainerStyles: string,
};

export type GenAlertHtmlProps = {
    //  Alert title
    title: string,
    // Alert text
    text: string,
};

/**
 * Helper class for creating and injecting alerts
 */
export class Alerts {
    /**
     * If {@link isAdguardTab}, append div, else we append iframe
     *
     * @param props - {@link AppendAlertElementProps}
     * @returns {HTMLElement}
     */
    public static appendAlertElement(props: AppendAlertElementProps): HTMLDivElement | HTMLIFrameElement {
        const {
            target,
            html,
            isAdguardTab,
            alertStyles,
            alertContainerStyles,
        } = props;

        const alertContainerElement = Elements.createStyleElement(alertContainerStyles);
        document.body.insertAdjacentElement('afterbegin', alertContainerElement);
        if (isAdguardTab) {
            return Elements.appendDiv({
                target,
                html,
            });
        }

        return Elements.appendIframe({
            target,
            html,
            styles: alertStyles,
        });
    }

    /**
     * Generates alert html
     *
     * @param props - {@link GenAlertHtmlProps}
     * @returns html string
     */
    public static genAlertHtml(props: GenAlertHtmlProps): string {
        const {
            title,
            text,
        } = props;

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
    }
}
