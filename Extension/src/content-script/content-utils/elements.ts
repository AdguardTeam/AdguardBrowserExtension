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

/**
 * Max zIndex value
 * https://www.w3.org/TR/CSS21/visuren.html#z-index
 */
const MAX_Z_INDEX = '2147483647';

export type AppendIframeProps = {
    target: Element,
    html: string,
    styles: string,
};

export type AppendDivProps = {
    target: Element,
    html: string
};

/**
 * Helper class for creating and injecting html elements
 */
export class Elements {
    /**
     * Create style element with provided css
     *
     * @param css - css text
     */
    public static createStyleElement(css: string): HTMLStyleElement {
        const styleElement = document.createElement('style');
        styleElement.appendChild(document.createTextNode(css));
        return styleElement;
    }

    /**
     * Creates iframe and appends it after target open tag
     *
     * @param props - {@link AppendIframeProps}
     * @param props.target - Node where to append iframe with html
     * @param props.html - html string to write inside iframe
     * @param props.styles - iframe styles text
     * @returns iframe element
     */
    public static appendIframe({
        target,
        html,
        styles,
    }: AppendIframeProps): HTMLIFrameElement {
        const styleElement = Elements.createStyleElement(styles);
        const prependedHtml = `${styleElement.outerHTML}\n${html}`;

        const iframe = document.createElement('iframe');
        iframe.src = 'about:blank';
        iframe.style.position = 'fixed';
        iframe.style.zIndex = MAX_Z_INDEX;
        iframe.srcdoc = prependedHtml;
        target.insertAdjacentElement('afterbegin', iframe);

        return iframe;
    }

    /**
     * Creates div and appends it to the page
     *
     * @param props - {@link AppendDivProps}
     * @param props.target - Node where to append div with html
     * @param props.html - Html string to write inside div
     * @returns div element
     */
    public static appendDiv({
        target,
        html,
    }: AppendDivProps): HTMLDivElement {
        const div = document.createElement('div');
        div.innerHTML = html;
        target.insertAdjacentElement('afterbegin', div);
        div.style.zIndex = MAX_Z_INDEX;
        return div;
    }
}
