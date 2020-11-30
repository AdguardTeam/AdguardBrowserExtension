import React, { useContext, useEffect } from 'react';

import { Header } from '../Header';
import { Footer } from '../Footer';
import { Icons } from '../ui/Icons';
import { Tabs } from '../Tabs';
import { MainContainer } from '../MainContainer';
import { popupStore } from '../../stores/PopupStore';
import { messenger } from '../../../services/messenger';

import '../../styles/main.pcss';

export const Popup = () => {
    const store = useContext(popupStore);

    // retrieve init data
    useEffect(() => {
        (async () => {
            await store.getPopupData();
        })();
    }, []);

    // subscribe to stats change
    useEffect(() => {
        const messageHandler = (message) => {
            switch (message.type) {
                case 'updateTotalBlocked': {
                    const { tabInfo } = message;
                    store.updateBlockedStats(tabInfo);
                    break;
                }
                default:
                    break;
            }
        };

        messenger.onMessage.addListener(messageHandler);

        return () => {
            messenger.onMessage.removeListener(messageHandler);
        };
    }, []);

    return (
        <div className="popup">
            <Icons />
            <Header />
            <MainContainer />
            <Tabs />
            <Footer />
        </div>
    );
};
