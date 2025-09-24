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

import React, { useContext, useEffect } from 'react';
import { observer } from 'mobx-react';

import { throttle } from 'lodash-es';

import { Filters } from '../Filters';
import {
    Messenger,
    messenger,
    type LongLivedConnectionCallbackMessage,
    Page,
} from '../../../services/messenger';
import { logger } from '../../../../common/logger';
import { rootStore } from '../../stores/RootStore';
import { RequestModal } from '../RequestWizard/RequestModal';
import { Icons as CommonIcons } from '../../../common/components/ui/Icons';
import { NotifierType } from '../../../../common/constants';
import { useAppearanceTheme } from '../../../common/hooks/useAppearanceTheme';
import { FilteringEvents } from '../FilteringEvents';
import { Icons } from '../ui/Icons';
import { PreserveLogModal } from '../PreserveLogModal/PreserveLogModal';

import '../../styles/styles.pcss';

const FilteringLog = observer(() => {
    const { wizardStore, logStore } = useContext(rootStore);
    const RESIZE_THROTTLE = 500;

    useAppearanceTheme(logStore.appearanceTheme);

    // init
    useEffect(() => {
        (async () => {
            await Promise.all([
                logStore.synchronizeOpenTabs(),
                logStore.getFilteringLogData(),
            ]);
        })();
    }, [logStore]);

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

            removeListenerCallback = Messenger.createLongLivedConnection(
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
        })();

        return () => {
            removeListenerCallback();
        };
    }, [logStore, wizardStore]);

    useEffect(() => {
        const windowStateHandler = () => {
            const {
                outerWidth,
                outerHeight,
                screenTop,
                screenLeft,
                screen,
            } = window;

            const isFullscreen = outerWidth === screen.width && outerHeight === screen.height;

            if (isFullscreen) {
                messenger.setFilteringLogWindowState({
                    state: 'fullscreen',
                });
            } else {
                messenger.setFilteringLogWindowState({
                    width: outerWidth,
                    height: outerHeight,
                    top: screenTop,
                    left: screenLeft,
                });
            }
        };

        const throttledWindowStateHandler = throttle(windowStateHandler, RESIZE_THROTTLE);

        window.addEventListener('beforeunload', windowStateHandler);
        window.addEventListener('resize', throttledWindowStateHandler);

        return () => {
            window.removeEventListener('beforeunload', windowStateHandler);
            window.removeEventListener('resize', throttledWindowStateHandler);
        };
    }, [logStore]);

    return (
        <>
            {logStore.isPreserveLogModalOpen && <PreserveLogModal />}
            <CommonIcons />
            <Icons />
            {wizardStore.isModalOpen
                && <RequestModal />}
            <Filters />
            <FilteringEvents />
        </>
    );
});

export { FilteringLog };
