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

import React, { useContext, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import { observer } from 'mobx-react';

import { rootStore } from '../../stores/RootStore';
import { SkipToContentButton } from '../SkipToContentButton';
import { Sidebar } from '../Sidebar';
import { Notifications } from '../Notifications';
import { Footer } from '../Footer';

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
