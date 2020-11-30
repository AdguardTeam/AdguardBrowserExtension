import React, { useContext, useEffect } from 'react';

import { Tabs } from '../Tabs';
import { Header } from '../Header';
import { Footer } from '../Footer';
import { Icons } from '../ui/Icons';
import { MainContainer } from '../MainContainer';
import { PromoNotification } from '../PromoNotification';
import { popupStore } from '../../stores/PopupStore';

import '../../styles/main.pcss';

export const Popup = () => {
    const store = useContext(popupStore);

    // retrieve init data
    useEffect(() => {
        (async () => {
            await store.getPopupData();
        })();
    }, []);

    // TODO subscribe to stats changes

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
};
