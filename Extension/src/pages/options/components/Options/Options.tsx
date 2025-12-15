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

import React, {
    useContext,
    useEffect,
    useRef,
} from 'react';
import {
    createHashRouter,
    createRoutesFromElements,
    RouterProvider,
} from 'react-router-dom';
import { observer } from 'mobx-react';

import {
    createMessageHandler,
    EVENTS,
    initialize,
    getOptionRoute,
} from 'options';

import { rootStore } from '../../stores/RootStore';
import { messenger } from '../../../services/messenger';
import { Icons as CommonIcons } from '../../../common/components/ui/Icons';
import { Loader } from '../../../common/components/Loader';
import { useAppearanceTheme } from '../../../common/hooks/useAppearanceTheme';
import { Icons } from '../ui/Icons';

import '../../styles/styles.pcss';

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

export const Options = observer(() => {
    const { settingsStore, uiStore, telemetryStore } = useContext(rootStore);
    const pageIdRef = useRef<string | null>(null);

    useAppearanceTheme(settingsStore.appearanceTheme);

    useEffect(() => {
        (async () => {
            const pageId = await messenger.addTelemetryOpenedPage();
            pageIdRef.current = pageId;
            telemetryStore.setPageId(pageId);
        })();

        const onUnload = () => {
            if (pageIdRef.current) {
                telemetryStore.setPageId(null);
                messenger.removeTelemetryOpenedPage(pageIdRef.current);
                pageIdRef.current = null;
            }
        };

        window.addEventListener('beforeunload', onUnload);

        return () => {
            window.removeEventListener('beforeunload', onUnload);
            onUnload();
        };
    }, [telemetryStore]);

    useEffect(() => {
        let removeListenerCallback = () => { };

        const subscribeToMessages = async () => {
            removeListenerCallback = await messenger.createEventListener(
                EVENTS,
                createMessageHandler(settingsStore, uiStore),
            );
        };

        (async () => {
            const isInitialized = await initialize(settingsStore, uiStore);

            if (isInitialized) {
                await subscribeToMessages();
            }
        })();

        return () => {
            removeListenerCallback();
        };
    }, [settingsStore, uiStore]);

    if (!settingsStore.optionsReadyToRender) {
        return null;
    }

    return (
        <>
            <CommonIcons />
            <Icons />
            <Loader showLoader={uiStore.showLoader} />
            <div className="page">
                <RouterProvider
                    // We are opting out these features and hiding the warning messages by setting it to false.
                    // TODO: Remove this when react-router-dom is updated to v7
                    // https://github.com/remix-run/react-router/issues/12250
                    future={{
                        // @ts-expect-error v7_relativeSplatPath can be used here, but types are not updated yet
                        v7_relativeSplatPath: false,
                        v7_startTransition: false,
                    }}
                    router={createRouter(getOptionRoute())}
                />
            </div>
        </>
    );
});
