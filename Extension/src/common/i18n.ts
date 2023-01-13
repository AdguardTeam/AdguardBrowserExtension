/**
 * @file
 * I18n file is part of AdGuard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
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
import browser from 'webextension-polyfill';

/**
 * Injects translations to DOM elements with i18n attributes
 */
export class I18n {
    /**
     * Initializes injector.
     */
    public static init() {
        document.addEventListener('DOMContentLoaded', I18n.translate);
    }

    /**
     * Processes i18n injections
     */
    private static translate() {
        I18n.translateElements('i18n');
        I18n.translateAttributes('i18n-plhr', 'placeholder');
        I18n.translateAttributes('i18n-href', 'href');
        I18n.translateAttributes('i18n-title', 'title');
    }

    /**
     * Translates elements with specified {@link i18nAttributeName}
     *
     * @param i18nAttributeName - i18n attribute
     */
    private static translateElements(i18nAttributeName: string) {
        document.querySelectorAll(`[${i18nAttributeName}]`).forEach(el => {
            const message = I18n.getI18nMessage(el, i18nAttributeName);

            if (!message) {
                return;
            }

            I18n.translateElement(el, message);
        });
    }

    /**
     * Replaces content of {@link element} to translation
     *
     * @param element - target element
     * @param message - element text
     */
    private static translateElement(element: Element, message: string): void {
        try {
            // remove original content
            while (element.lastChild) {
                element.removeChild(element.lastChild);
            }
            // append translated content
            I18n.processString(message, element);
        } catch (ex) {
            // Ignore exceptions
        }
    }

    /**
     * Creates translated {@link element} child nodes and appends it to parent
     *
     * @param html - html string
     * @param element - target element
     */
    private static processString(html: string, element: Element): void {
        let el: Element;

        const match1 = /^([^]*?)<(a|strong|span|i)([^>]*)>(.*?)<\/\2>([^]*)$/m.exec(html);
        const match2 = /^([^]*?)<(br|input)([^>]*)\/?>([^]*)$/m.exec(html);
        if (match1) {
            // TODO: safe types
            /* eslint-disable @typescript-eslint/no-non-null-assertion */
            I18n.processString(match1[1]!, element);

            el = I18n.createElement(match1[2]!, match1[3]!);

            I18n.processString(match1[4]!, el);
            element.appendChild(el);

            I18n.processString(match1[5]!, element);
        } else if (match2) {
            I18n.processString(match2[1]!, element);

            el = I18n.createElement(match2[2]!, match2[3]!);
            element.appendChild(el);

            I18n.processString(match2[4]!, element);
            /* eslint-enable @typescript-eslint/no-non-null-assertion */
        } else {
            element.appendChild(document.createTextNode(html.replace(/&nbsp;/g, '\u00A0')));
        }
    }

    /**
     * Creates elements with specified attributes
     *
     * @param tagName - element tag
     * @param attributes - attributes string value
     *
     * @returns created element
     */
    private static createElement(tagName: string, attributes: string): Element {
        const el = document.createElement(tagName);
        if (!attributes) {
            return el;
        }

        attributes
            .split(/([a-z]+='[^']+')/)
            .forEach(attr => {
                if (!attr) {
                    return;
                }

                const index = attr.indexOf('=');
                let attrName;
                let attrValue;
                if (index > 0) {
                    attrName = attr.substring(0, index);
                    attrValue = attr.substring(index + 2, attr.length - 1);
                }
                if (attrName && attrValue) {
                    el.setAttribute(attrName, attrValue);
                }
            });

        return el;
    }

    /**
     * Finds all elements with specified {@link i18nAttributeName},
     * translates attributes and sets to elements {@link attributeName}
     *
     * @param i18nAttributeName -  name of i18n attribute
     * @param attributeName  - name of translated attribute
     */
    private static translateAttributes(
        i18nAttributeName: string,
        attributeName: string,
    ): void {
        document.querySelectorAll(`[${i18nAttributeName}]`).forEach(element => {
            const message = I18n.getI18nMessage(element, i18nAttributeName);

            if (!message) {
                return;
            }

            element.setAttribute(attributeName, message);
        });
    }

    /**
     * Gets element attribute value and translate it
     *
     * @param element - page element
     * @param attributeName - name of element attribute
     * @returns translated attribute value
     */
    private static getI18nMessage(element: Element, attributeName: string): string | null {
        const attribute = element.getAttribute(attributeName);

        if (!attribute) {
            return null;
        }

        return browser.i18n.getMessage(attribute);
    }
}
