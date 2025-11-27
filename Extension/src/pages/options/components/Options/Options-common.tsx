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

import React, { useContext, useRef } from 'react';
import {
    createHashRouter,
    createRoutesFromElements,
    Outlet,
} from 'react-router-dom';
import { observer } from 'mobx-react';

import { Sidebar } from '../Sidebar';
import { Footer } from '../Footer';
import { rootStore } from '../../stores/RootStore';
import { Notifications } from '../Notifications';
import { SkipToContentButton } from '../SkipToContentButton';

export const createRouter = (
    children: React.ReactNode,
): ReturnType<typeof createHashRouter> => {
    return createHashRouter(
        createRoutesFromElements(children),
        // We are opting out these features and hiding the warning messages by setting it to false.
        // TODO: Remove this when react-router-dom is updated to v7
        // https://github.com/remix-run/react-router/issues/12250
        {
            future: {
                v7_relativeSplatPath: false,
                v7_fetcherPersist: false,
                v7_normalizeFormMethod: false,
                v7_partialHydration: false,
                v7_skipActionErrorRevalidation: false,
            },
        },
    );
};

export const OptionsLayout = observer(() => {
    const mainRef = useRef(null);
    const { uiStore } = useContext(rootStore);

    return (
        <>
            <SkipToContentButton mainRef={mainRef} />
            <Sidebar />
            <div className="inner">
                <main
                    ref={mainRef}
                    className="content"
                    inert={uiStore.isSidebarOpen ? '' : undefined}
                >
                    <Notifications />
                    <Outlet />
                </main>
                <Footer />
            </div>
        </>
    );
});
