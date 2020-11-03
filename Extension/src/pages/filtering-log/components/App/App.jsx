import React, { useContext, useEffect } from 'react';

import { Actions } from '../Actions';
import { Filters } from '../Filters';
import { FilteringEvents } from '../FilteringEvents';
import { messenger } from '../../../services/messenger';
import { log } from '../../../../background/utils/log';
import { rootStore } from '../../stores/RootStore';

const App = () => {
    const { logStore } = useContext(rootStore);

    useEffect(() => {
        let removeListenerCallback = async () => {};

        (async () => {
            await logStore.synchronizeOpenTabs();
            await messenger.onOpenFilteringLogPage();

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
                        case TAB_CLOSE:
                            // console.log(message);
                            // logStore.onTabClose();
                            break;
                        case TAB_RESET:
                            // console.log(message);
                            // logStore.onTabReset();
                            break;
                        case LOG_EVENT_ADDED: {
                            const [tabInfo, event] = data;
                            logStore.onEventAdded(tabInfo, event);
                            break;
                        }
                        case LOG_EVENT_UPDATED:
                            // console.log(message);
                            // logStore.onEventUpdated();
                            break;
                        default: {
                            log.debug('There is no listener for type:', type);
                            break;
                        }
                    }
                },
            );
        })();

        return () => {
            messenger.onCloseFilteringLogPage();
            removeListenerCallback();
        };
    }, []);

    return (
        <>
            <Actions />
            <Filters />
            <FilteringEvents />
        </>
    );
};

export { App };
