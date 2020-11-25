import React, { useContext, useEffect } from 'react';

import { Header } from '../Header';
import { Main } from '../Main';
import { Footer } from '../Footer';
import { popupStore } from '../../stores/PopupStore';
import { Icons } from '../ui/Icons';

import '../../styles/main.pcss';
import { Tabs } from '../Tabs';

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
            <Main />
            <Tabs />
            <Footer />
        </div>
    );
};
