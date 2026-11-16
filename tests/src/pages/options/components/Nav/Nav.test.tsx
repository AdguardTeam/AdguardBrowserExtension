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

import React, { createContext } from 'react';

import {
    cleanup,
    fireEvent,
    render,
    screen,
} from '@testing-library/react';
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

import { TelemetryEventName, TelemetryScreenName } from '../../../../../../Extension/src/common/telemetry';
import { TelemetryStore } from '../../../../../../Extension/src/pages/common/telemetry/TelemetryStore';

const mocks = vi.hoisted(() => ({
    sendTelemetryCustomEvent: vi.fn(),
}));

vi.mock('../../../../../../Extension/src/common/translators/translator', () => ({
    translator: {
        getMessage: (key: string) => key,
    },
}));

vi.mock('../../../../../../Extension/src/pages/services/messenger', () => ({
    messenger: {
        sendTelemetryCustomEvent: mocks.sendTelemetryCustomEvent,
    },
}));

vi.mock('../../../../../../Extension/src/pages/options/components/Nav/nav.pcss', () => ({}));

const renderNav = async (allowTelemetry = false, route = '/filters?group=2#selected') => {
    const telemetryStore = new TelemetryStore();
    telemetryStore.setIsAnonymizedUsageDataAllowed(allowTelemetry);
    const context = createContext({ telemetryStore });
    const onLinkClick = vi.fn();

    vi.doMock('../../../../../../Extension/src/pages/options/stores/RootStore', () => ({
        rootStore: context,
    }));

    const { MemoryRouter, useLocation } = await import('react-router-dom');
    const { Nav } = await import('../../../../../../Extension/src/pages/options/components/Nav/Nav');

    function CurrentRoute() {
        const location = useLocation();
        return (
            <output aria-label="Current options route">
                {location.pathname}
                {location.search}
                {location.hash}
            </output>
        );
    }

    render(
        <MemoryRouter initialEntries={[route]}>
            <Nav onLinkClick={onLinkClick} />
            <CurrentRoute />
        </MemoryRouter>,
    );

    return { onLinkClick };
};

describe('Nav AdGuard products link', () => {
    beforeEach(() => {
        vi.resetModules();
        mocks.sendTelemetryCustomEvent.mockReset();
        mocks.sendTelemetryCustomEvent.mockResolvedValue(undefined);
    });

    afterEach(() => {
        cleanup();
        vi.restoreAllMocks();
    });

    it('renders after About with the products forward action and a safe new-tab target', async () => {
        await renderNav();

        const productsLink = screen.getByRole('link', { name: 'options_adguard_products' });
        const aboutLink = screen.getByRole('link', { name: 'options_about' });
        const links = screen.getAllByRole('link');
        expect(links.indexOf(productsLink)).toBe(links.indexOf(aboutLink) + 1);

        const url = new URL(productsLink.getAttribute('href')!);
        expect(url.origin).toBe('https://link.adtidy.org');
        expect(url.pathname).toBe('/forward.html');
        expect(Object.fromEntries(url.searchParams)).toEqual({
            app: 'browser_extension',
            action: 'other_products',
            from: 'options_screen',
        });
        expect(productsLink.getAttribute('target')).toBe('_blank');
        expect(productsLink.getAttribute('rel')?.split(' ')).toEqual(expect.arrayContaining([
            'noopener',
            'noreferrer',
        ]));
        expect(productsLink.getAttribute('aria-current')).toBeNull();
        expect(productsLink.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
        expect(mocks.sendTelemetryCustomEvent).not.toHaveBeenCalled();
    });

    it.each([true, false])('keeps the options route and closes the sidebar with telemetry consent %s', async (
        allowTelemetry,
    ) => {
        const { onLinkClick } = await renderNav(allowTelemetry);

        fireEvent.click(screen.getByRole('link', { name: 'options_adguard_products' }));

        expect(screen.getByLabelText('Current options route').textContent).toBe('/filters?group=2#selected');
        expect(onLinkClick).toHaveBeenCalledOnce();
        if (allowTelemetry) {
            expect(mocks.sendTelemetryCustomEvent).toHaveBeenCalledExactlyOnceWith(
                TelemetryScreenName.MainPage,
                TelemetryEventName.AdguardProductsClick,
            );
        } else {
            expect(mocks.sendTelemetryCustomEvent).not.toHaveBeenCalled();
        }
    });

    it('preserves internal navigation without sending the products event', async () => {
        const { onLinkClick } = await renderNav(true);

        fireEvent.click(screen.getByRole('link', { name: 'options_about' }));

        expect(screen.getByLabelText('Current options route').textContent).toBe('/about');
        expect(onLinkClick).toHaveBeenCalledOnce();
        expect(mocks.sendTelemetryCustomEvent).not.toHaveBeenCalled();
    });
});
