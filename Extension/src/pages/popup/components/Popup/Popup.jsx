import React, { useContext, useEffect } from 'react';
import { observer } from 'mobx-react';

import { Tabs } from '../Tabs';
import { Header } from '../Header';
import { Footer } from '../Footer';
import { Icons } from '../ui/Icons';
import { MainContainer } from '../MainContainer';
import { PromoNotification } from '../PromoNotification';
import { popupStore } from '../../stores/PopupStore';
import { messenger } from '../../../services/messenger';
import { useAppearanceTheme } from '../../../common/hooks/useAppearanceTheme';

import '../../styles/main.pcss';
import './popup.pcss';

export const Popup = observer(() => {
    const {
        appearanceTheme,
        getPopupData,
        updateBlockedStats,
    } = useContext(popupStore);

    useAppearanceTheme(appearanceTheme);

    // retrieve init data
    useEffect(() => {
        (async () => {
            await getPopupData();
        })();
    }, [getPopupData]);

    // subscribe to stats change
    useEffect(() => {
        const messageHandler = (message) => {
            switch (message.type) {
                case 'updateTotalBlocked': {
                    const { tabInfo } = message;
                    updateBlockedStats(tabInfo);
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
    }, [updateBlockedStats]);

    return (
        <div className="popup">
            <Icons />
            <Header />
            <MainContainer />
            <Tabs />
            <Footer />
            <PromoNotification />
        </div>
    );
});
