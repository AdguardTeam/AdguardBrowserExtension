import React, { useContext, useEffect } from 'react';
import { observer } from 'mobx-react';

import { Filters } from '../Filters';
import { messenger } from '../../../services/messenger';
import { log } from '../../../../common/log';
import { rootStore } from '../../stores/RootStore';
import { RequestModal } from '../RequestWizard/RequestModal';
import { Icons } from '../../../common/components/ui/Icons';
import { FILTERING_LOG, NOTIFIER_TYPES } from '../../../../common/constants';
import { useAppearanceTheme } from '../../../common/hooks/useAppearanceTheme';
import { FilteringEvents } from '../FilteringEvents';

import '../../styles/styles.pcss';

const FilteringLog = observer(() => {
    const { wizardStore, logStore } = useContext(rootStore);

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
        const FETCH_EVENTS_TIMEOUT_MS = 1500;
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
        let removeListenerCallback = async () => {};

        (async () => {
            const events = [
                NOTIFIER_TYPES.TAB_ADDED,
                NOTIFIER_TYPES.TAB_UPDATE,
                NOTIFIER_TYPES.TAB_CLOSE,
                NOTIFIER_TYPES.TAB_RESET,
                NOTIFIER_TYPES.SETTING_UPDATED,
            ];

            removeListenerCallback = messenger.createLongLivedConnection(
                FILTERING_LOG,
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
                        case NOTIFIER_TYPES.SETTING_UPDATED: {
                            const [{ propertyName, propertyValue }] = data;
                            logStore.onSettingUpdated(propertyName, propertyValue);
                            break;
                        }
                        default: {
                            log.debug('There is no listener for type:', type);
                            break;
                        }
                    }
                },
            );
        })();

        return () => {
            removeListenerCallback();
        };
    }, [logStore]);

    return (
        <>
            <Icons />
            {wizardStore.isModalOpen
            && <RequestModal />}
            <Filters />
            <FilteringEvents />
        </>
    );
});

export { FilteringLog };
