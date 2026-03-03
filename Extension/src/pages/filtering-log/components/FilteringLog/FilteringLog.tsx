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

import React, {
    useContext,
    useEffect,
    useRef,
} from 'react';
import { observer } from 'mobx-react';

import { throttle } from 'lodash-es';
import browser from 'webextension-polyfill';

import { Filters } from '../Filters';
import {
    Messenger,
    type LongLivedConnectionCallbackMessage,
    Page,
} from '../../../services/messenger';
import { logger } from '../../../../common/logger';
import { rootStore } from '../../stores/RootStore';
import { RequestModal } from '../RequestWizard/RequestModal';
import { Icons as CommonIcons } from '../../../common/components/ui/Icons';
import { NotifierType } from '../../../../common/constants';
import { FULLSCREEN_STATE } from '../../../../common/messages/constants';
import { optionsStorage } from '../../../options/options-storage';
import { useAppearanceTheme } from '../../../common/hooks/useAppearanceTheme';
import { FilteringEvents } from '../FilteringEvents';
import { Icons } from '../ui/Icons';
import { PreserveLogModal } from '../PreserveLogModal/PreserveLogModal';
import { CustomizeModal } from '../CustomizeModal';
import { Sidebar } from '../Sidebar';
import { TelemetryScreenName } from '../../../../background/services/telemetry/enums';
import { SettingOption } from '../../../../background/schema';

import '../../styles/styles.pcss';

const FilteringLog = observer(() => {
    const { wizardStore, logStore, telemetryStore } = useContext(rootStore);
    const RESIZE_THROTTLE_MS = 500;
    const POSITION_POLL_INTERVAL_MS = 500;
    const pageIdRef = useRef<string | null>(null);

    useAppearanceTheme(logStore.appearanceTheme);

    // Initialize telemetry and load data
    useEffect(() => {
        (async () => {
            // Load data first to set isAnonymizedUsageDataAllowed
            await Promise.all([
                logStore.synchronizeOpenTabs(),
                logStore.getFilteringLogData(),
            ]);

            // Then set pageId and send telemetry page view event
            const pageId = await messenger.addTelemetryOpenedPage();
            pageIdRef.current = pageId;
            telemetryStore.setPageId(pageId);

            // Send telemetry page view event manually since data is loaded in this component
            telemetryStore.sendPageViewEvent(TelemetryScreenName.FilteringLogScreen);
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
    }, [telemetryStore, logStore]);

    useEffect(() => {
        const FETCH_EVENTS_TIMEOUT_MS = 300;

        logStore.getFilteringLogEvents();

        const intervalId = setInterval(async () => {
            await logStore.getFilteringLogEvents();
        }, FETCH_EVENTS_TIMEOUT_MS);

        return () => {
            clearInterval(intervalId);
        };
    }, [logStore]);

    // listen for hash change
    useEffect(() => {
        const handleHashChange = async () => {
            // Set current tab id as selected, background page provides it with hash value
            const currentTabId = document.location.hash.slice(1);
            await logStore.setSelectedTabId(currentTabId);
        };

        handleHashChange();

        window.addEventListener('hashchange', handleHashChange);

        return function onUnmount() {
            window.removeEventListener('hashchange', handleHashChange);
        };
    }, [logStore]);

    // append message listeners
    useEffect(() => {
        let removeListenerCallback = () => { };

        (async () => {
            const events = [
                NotifierType.TabAdded,
                NotifierType.TabUpdate,
                NotifierType.TabClose,
                NotifierType.TabReset,
                NotifierType.SettingUpdated,
                NotifierType.CustomFilterAdded,
            ];

            const { onUnload } = Messenger.createLongLivedConnection(
                Page.FilteringLog,
                events,
                async (message: LongLivedConnectionCallbackMessage) => {
                    const { type, data } = message;

                    switch (type) {
                        case NotifierType.TabAdded:
                        case NotifierType.TabUpdate: {
                            const [tabInfo] = data;
                            logStore.onTabUpdate(tabInfo);
                            break;
                        }
                        case NotifierType.TabClose: {
                            const [tabInfo] = data;
                            await logStore.onTabClose(tabInfo);
                            break;
                        }
                        case NotifierType.TabReset: {
                            const [tabInfo] = data;
                            logStore.onTabReset(tabInfo);
                            break;
                        }
                        case NotifierType.SettingUpdated: {
                            const [{ propertyName, propertyValue }] = data;
                            logStore.onSettingUpdated(propertyName, propertyValue);
                            if (propertyName === SettingOption.AllowAnonymizedUsageData) {
                                telemetryStore.setIsAnonymizedUsageDataAllowed(propertyValue);
                            }
                            break;
                        }
                        case NotifierType.CustomFilterAdded: {
                            await logStore.getFilteringLogData();
                            break;
                        }
                        default: {
                            logger.warn('[ext.FilteringLog]: there is no listener for type:', type);
                            break;
                        }
                    }
                },
            );

            removeListenerCallback = onUnload;
        })();

        return () => {
            removeListenerCallback();
        };
    }, [logStore, telemetryStore, wizardStore]);

    useEffect(() => {
        const saveWindowState = async () => {
            try {
                const win = await browser.windows.getCurrent();

                const {
                    state,
                    width,
                    height,
                    top,
                    left,
                } = win;

                if (state === FULLSCREEN_STATE) {
                    optionsStorage.setItem(
                        optionsStorage.KEYS.FILTERING_LOG_WINDOW_STATE,
                        { state: FULLSCREEN_STATE },
                    );
                } else if (
                    width !== undefined
                    && height !== undefined
                    && top !== undefined
                    && left !== undefined
                ) {
                    optionsStorage.setItem(
                        optionsStorage.KEYS.FILTERING_LOG_WINDOW_STATE,
                        {
                            width,
                            height,
                            top,
                            left,
                        },
                    );
                }
            } catch (e: unknown) {
                logger.debug('[ext.FilteringLog]: failed to save window state:', e);
            }
        };

        const throttledSaveWindowState = throttle(saveWindowState, RESIZE_THROTTLE_MS);

        window.addEventListener('resize', throttledSaveWindowState, { passive: true });

        let lastScreenX = window.screenX;
        let lastScreenY = window.screenY;

        const positionPollId = setInterval(() => {
            if (window.screenX !== lastScreenX || window.screenY !== lastScreenY) {
                lastScreenX = window.screenX;
                lastScreenY = window.screenY;
                saveWindowState();
            }
        }, POSITION_POLL_INTERVAL_MS);

        return () => {
            window.removeEventListener('resize', throttledSaveWindowState);
            clearInterval(positionPollId);
        };
    }, []);

    return (
        <>
            <CommonIcons />
            <Icons />
            {logStore.isPreserveLogModalOpen && <PreserveLogModal />}
            {wizardStore.isModalOpen && <RequestModal />}
            {logStore.isCustomizeModalOpen && <CustomizeModal />}
            <Sidebar />
            <Filters />
            <FilteringEvents />
        </>
    );
});

export { FilteringLog };
