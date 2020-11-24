import React, { useContext, useEffect } from 'react';

import { Header } from '../Header';
import { Main } from '../Main';
import { Actions } from '../Actions';
import { Footer } from '../Footer';
import { popupStore } from '../../stores/PopupStore';
import { Icons } from '../ui/Icons';

import '../../styles/main.pcss';

// TODO modules
//  * header
//  * main
//  * stats
//      stats graph
//      stats table
//  * actions
//  * footer
//  * promo notifications

// TODO Checklist
//  * stats updated on the fly
//  * footer content should depend on browser
//  * check necessity of popup resize (Extension/src/pages/popup/popup-controller.js:998)

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
            <Actions />
            <Footer />
        </div>
    );
};
