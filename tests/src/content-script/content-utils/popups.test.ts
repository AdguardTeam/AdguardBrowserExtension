/**
 * Copyright (c) 2015-2026 Adguard Software Ltd.
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
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

import { Popups } from '../../../../Extension/src/content-script/content-utils/popups';
import {
    MessageType,
    sendMessage,
    EDGE_MV3_MIGRATION_SETTINGS_LINK_ID,
    type ShowEdgeMv3MigrationPopupMessage,
    type ShowVersionUpdatedPopupMessage,
} from '../../../../Extension/src/common/messages';

vi.mock('../../../../Extension/src/common/messages');

const OFFER_BUTTON_HREF = 'https://link.adtidy.org/forward.html?app=browser_extension&action=edge_mv3_migration_promo&from=version_popup';

const message: ShowEdgeMv3MigrationPopupMessage = {
    type: MessageType.ShowEdgeMv3MigrationPopup,
    data: {
        isAdguardTab: false,
        title: 'AdGuard extension migrated to Manifest V3',
        description: 'Your settings, filters, and rules are kept.',
        userScriptsText: `Turn on <b>Allow user scripts</b> in the browser’s <a href="#" id="${EDGE_MV3_MIGRATION_SETTINGS_LINK_ID}">extension settings</a>`,
        offerTitle: 'Remove limits — get the desktop app',
        offerButtonText: 'Get 30% off',
        offerButtonHref: OFFER_BUTTON_HREF,
        offerBgImage: 'data:image/svg+xml;base64,PHN2Zy8+',
        alertStyles: '',
        iframeStyles: '',
    },
};

const versionUpdatedMessage: ShowVersionUpdatedPopupMessage = {
    type: MessageType.ShowVersionUpdatedPopup,
    data: {
        isAdguardTab: false,
        title: 'AdGuard extension has been updated to version 5.6.0.0',
        description: 'This is a major extension upgrade.',
        changelogHref: 'https://link.adtidy.org/forward.html?app=browser_extension&action=github_version_popup',
        changelogText: 'What\'s new in this version?',
        showPromoNotification: true,
        offer: 'Add spark to browsing',
        offerDesc: '',
        offerButtonText: 'Unlock the deal',
        offerButtonHref: 'https://link.adtidy.org/forward.html?app=browser_extension&action=new_year_25&from=version_popup',
        offerBgImage: '',
        disableNotificationText: 'Disable notifications',
        alertStyles: '',
        iframeStyles: '',
    },
};

/**
 * Shows a popup, copies its markup into the iframe document
 * (jsdom does not render `srcdoc`) and fires `load`, so the popup
 * registers its click handlers the same way it does in a browser.
 * Fake timers are switched on only afterwards, so they do not interfere
 * with jsdom creating the iframe document.
 *
 * @param show Shows the popup.
 * @param iframeSelector Selector of the injected iframe.
 *
 * @returns Injected iframe and its document.
 *
 * @throws Error if the popup iframe was not injected.
 */
const renderPopup = (
    show: () => void,
    iframeSelector: string,
): { iframe: HTMLIFrameElement; doc: Document } => {
    show();

    const iframe = document.querySelector<HTMLIFrameElement>(iframeSelector);
    const doc = iframe?.contentDocument;
    if (!iframe || !doc) {
        throw new Error(`Popup iframe "${iframeSelector}" was not injected`);
    }

    doc.body.innerHTML = iframe.srcdoc;
    iframe.dispatchEvent(new Event('load'));
    vi.useFakeTimers();

    return { iframe, doc };
};

/**
 * Shows the Edge MV3 migration popup.
 *
 * @returns Injected iframe and its document.
 */
const showPopup = (): { iframe: HTMLIFrameElement; doc: Document } => renderPopup(
    () => Popups.showEdgeMv3MigrationPopup(message),
    'iframe.adguard-edge-mv3-migration-iframe',
);

/**
 * Clicks an element inside the popup.
 *
 * @param doc Iframe document.
 * @param selector Selector of the element to click.
 *
 * @returns Dispatched click event.
 *
 * @throws Error if the element is not found.
 */
const click = (doc: Document, selector: string): MouseEvent => {
    const element = doc.querySelector(selector);
    if (!element) {
        throw new Error(`Element "${selector}" not found`);
    }

    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    element.dispatchEvent(event);

    return event;
};

describe('Popups.showEdgeMv3MigrationPopup', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.useRealTimers();
        document.body.innerHTML = '';
    });

    it('renders the mockup content without the changelog and opt-out links', () => {
        const { doc } = showPopup();

        expect(doc.querySelector('.adguard-update-popup__title')?.textContent?.trim())
            .toBe('AdGuard extension migrated to Manifest V3');
        expect(doc.querySelector('.adguard-update-popup__migration-desc b')?.textContent).toBe('Allow user scripts');
        expect(doc.getElementById(EDGE_MV3_MIGRATION_SETTINGS_LINK_ID)?.textContent).toBe('extension settings');
        expect(doc.querySelector('.adguard-update-popup__offer-title')?.textContent?.trim())
            .toBe('Remove limits — get the desktop app');
        expect(doc.querySelector('.adguard-update-popup__btn')?.getAttribute('href')).toBe(OFFER_BUTTON_HREF);
        expect(doc.querySelector('.adguard-update-popup__links')).toBeNull();
        expect(doc.querySelector('.disable-notifications')).toBeNull();
    });

    // jsdom cannot create trusted events, so the user's click is checked manually by QA.
    it('ignores settings link clicks made by page scripts and keeps the popup', () => {
        const { iframe, doc } = showPopup();

        const event = click(doc, `#${EDGE_MV3_MIGRATION_SETTINGS_LINK_ID}`);
        vi.advanceTimersByTime(100);

        expect(event.defaultPrevented).toBe(true);
        expect(sendMessage).not.toHaveBeenCalled();
        expect(iframe.isConnected).toBe(true);
    });

    it('removes only the offer block when its close button is clicked', () => {
        const { iframe, doc } = showPopup();

        // jsdom does not lay out, so the popup height after the offer is removed is set by the test
        const popup = doc.querySelector('.adguard-update-popup');
        Object.defineProperty(popup, 'offsetHeight', { value: 380, configurable: true });

        click(doc, '.adguard-update-popup__offer-close');
        vi.advanceTimersByTime(100);

        expect(doc.querySelector('.adguard-update-popup__offer')).toBeNull();
        expect(doc.querySelector('.adguard-update-popup__title')).not.toBeNull();
        expect(iframe.isConnected).toBe(true);
        expect(iframe.style.minHeight).toBe('396px');
        expect(sendMessage).not.toHaveBeenCalled();
    });

    it('removes only the offer block when the offer button is clicked', () => {
        const { iframe, doc } = showPopup();
        // jsdom does not implement navigation, so the test stops it
        doc.querySelector('.adguard-update-popup__btn')?.addEventListener('click', (e) => e.preventDefault());

        click(doc, '.adguard-update-popup__btn');
        vi.advanceTimersByTime(100);

        expect(doc.querySelector('.adguard-update-popup__offer')).toBeNull();
        expect(iframe.isConnected).toBe(true);
        expect(sendMessage).not.toHaveBeenCalled();
    });

    it('removes the whole popup when the main close button is clicked', () => {
        const { iframe, doc } = showPopup();

        click(doc, '.adguard-update-popup__close');
        vi.advanceTimersByTime(100);

        expect(iframe.isConnected).toBe(false);
        expect(sendMessage).not.toHaveBeenCalled();
    });
});

describe('Popups.showVersionUpdatedPopup with a promo', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.useRealTimers();
        document.body.innerHTML = '';
    });

    /**
     * Shows the application updated popup with a promo offer.
     *
     * @returns Injected iframe and its document.
     */
    const showVersionPopup = (): { iframe: HTMLIFrameElement; doc: Document } => renderPopup(
        () => Popups.showVersionUpdatedPopup(versionUpdatedMessage),
        'iframe.adguard-update-iframe',
    );

    it('removes only the offer block and marks the promo viewed when its close button is clicked', () => {
        const { iframe, doc } = showVersionPopup();
        // jsdom does not lay out, so the popup height after the offer is removed is set by the test
        const popup = doc.querySelector('.adguard-update-popup');
        Object.defineProperty(popup, 'offsetHeight', { value: 300, configurable: true });

        click(doc, '.adguard-update-popup__offer-close');
        vi.advanceTimersByTime(100);

        expect(doc.querySelector('.adguard-update-popup__offer')).toBeNull();
        expect(doc.querySelector('.adguard-update-popup__title')).not.toBeNull();
        expect(iframe.isConnected).toBe(true);
        expect(iframe.style.minHeight).toBe('316px');
        expect(sendMessage).toHaveBeenCalledWith({
            type: MessageType.SetNotificationViewed,
            data: { withDelay: false },
        });
    });

    it('removes the whole popup and marks the promo viewed when the main close button is clicked', () => {
        const { iframe, doc } = showVersionPopup();

        click(doc, '.adguard-update-popup__close');
        vi.advanceTimersByTime(100);

        expect(iframe.isConnected).toBe(false);
        expect(sendMessage).toHaveBeenCalledWith({
            type: MessageType.SetNotificationViewed,
            data: { withDelay: false },
        });
    });
});
