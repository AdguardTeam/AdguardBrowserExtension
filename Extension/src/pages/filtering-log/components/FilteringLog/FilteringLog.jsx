import React, { useContext, useEffect } from 'react';

import { Actions } from '../Actions';
import { Filters } from '../Filters';
import { FilteringEvents } from '../FilteringEvents';
import { messenger } from '../../../services/messenger';
import { log } from '../../../../common/log';
import { rootStore } from '../../stores/RootStore';
import { RequestModal } from '../RequestWizard/RequestModal';
import { Icons } from '../../../common/components/ui/Icons';
import { NOTIFIER_TYPES } from '../../../../common/constants';

import '../../styles/styles.pcss';

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
            const events = [
                NOTIFIER_TYPES.TAB_ADDED,
                NOTIFIER_TYPES.TAB_UPDATE,
                NOTIFIER_TYPES.TAB_CLOSE,
                NOTIFIER_TYPES.TAB_RESET,
                NOTIFIER_TYPES.LOG_EVENT_ADDED,
                NOTIFIER_TYPES.LOG_EVENT_UPDATED,
            ];

            removeListenerCallback = await messenger.createEventListener(
                events,
                async (message) => {
                    const { type, data } = message;

                    switch (type) {
                        case NOTIFIER_TYPES.TAB_ADDED:
                        case NOTIFIER_TYPES.TAB_UPDATE: {
                            const [tabInfo] = data;
                            logStore.onTabUpdate(tabInfo);
                            break;
                        }
                        case NOTIFIER_TYPES.TAB_CLOSE: {
                            const [tabInfo] = data;
                            await logStore.onTabClose(tabInfo);
                            break;
                        }
                        case NOTIFIER_TYPES.TAB_RESET: {
                            const [tabInfo] = data;
                            logStore.onTabReset(tabInfo);
                            break;
                        }
                        case NOTIFIER_TYPES.LOG_EVENT_ADDED: {
                            const [tabInfo, event] = data;
                            logStore.onEventAdded(tabInfo, event);
                            break;
                        }
                        case NOTIFIER_TYPES.LOG_EVENT_UPDATED: {
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
