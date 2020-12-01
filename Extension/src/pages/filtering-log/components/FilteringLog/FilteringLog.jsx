import React, { useContext, useEffect } from 'react';

import { Actions } from '../Actions';
import { Filters } from '../Filters';
import { FilteringEvents } from '../FilteringEvents';
import { messenger } from '../../../services/messenger';
import { log } from '../../../../background/utils/log';
import { rootStore } from '../../stores/RootStore';
import { RequestModal } from '../RequestWizard/RequestModal';
import { Icons } from '../../../../common/components/ui/Icons';

import '../../styles/styles.pcss';

// TODO set dark-mode and light mode in the same file
//  e.g. https://medium.com/@haxzie/dark-and-light-theme-switcher-using-css-variables-and-pure-javascript-zocada-dd0059d72fa2
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    require('../../styles/dark-mode.pcss');
} else {
    require('../../styles/light-mode.pcss');
}

const FilteringLog = () => {
    const { logStore } = useContext(rootStore);

    // init
    useEffect(() => {
        (async () => {
            await logStore.synchronizeOpenTabs();
            await logStore.getLogInitData();
            await messenger.onOpenFilteringLogPage();
        })();
    }, []);

    // listen for hash change
    useEffect(() => {
        const handleHashChange = async () => {
            // Set current tab id as selected, background page provides it with hash value
            // eslint-disable-next-line no-restricted-globals
            const currentTabId = location.hash.slice(1);
            await logStore.setSelectedTabId(currentTabId);
        };

        handleHashChange();

        window.addEventListener('hashchange', handleHashChange);

        return function onUnmount() {
            window.removeEventListener('hashchange', handleHashChange);
        };
    }, []);

    // append message listeners
    useEffect(() => {
        let removeListenerCallback = async () => {};

        (async () => {
            const TAB_ADDED = 'log.tab.added';
            const TAB_UPDATE = 'log.tab.update';
            const TAB_CLOSE = 'log.tab.close';
            const TAB_RESET = 'log.tab.reset';
            const LOG_EVENT_ADDED = 'log.event.added';
            const LOG_EVENT_UPDATED = 'log.event.updated';

            const events = [
                TAB_ADDED,
                TAB_UPDATE,
                TAB_CLOSE,
                TAB_RESET,
                LOG_EVENT_ADDED,
                LOG_EVENT_UPDATED,
            ];

            removeListenerCallback = await messenger.createEventListener(
                events,
                async (message) => {
                    const { type, data } = message;

                    switch (type) {
                        case TAB_ADDED:
                        case TAB_UPDATE: {
                            logStore.onTabUpdate(...data);
                            break;
                        }
                        case TAB_CLOSE: {
                            const [tabInfo] = data;
                            await logStore.onTabClose(tabInfo);
                            break;
                        }
                        case TAB_RESET: {
                            const [tabInfo] = data;
                            logStore.onTabReset(tabInfo);
                            break;
                        }
                        case LOG_EVENT_ADDED: {
                            const [tabInfo, event] = data;
                            logStore.onEventAdded(tabInfo, event);
                            break;
                        }
                        case LOG_EVENT_UPDATED: {
                            const [tabInfo, event] = data;
                            logStore.onEventUpdated(tabInfo, event);
                            break;
                        }
                        default: {
                            log.debug('There is no listener for type:', type);
                            break;
                        }
                    }
                },
                () => {
                    messenger.onCloseFilteringLogPage();
                },
            );
        })();

        return () => {
            removeListenerCallback();
        };
    }, []);

    return (
        <>
            <Icons />
            <RequestModal />
            <Actions />
            <Filters />
            <FilteringEvents />
        </>
    );
};

export { FilteringLog };
