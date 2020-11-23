import React from 'react';

import { Header } from '../Header';
import { Main } from '../Main';
import { Actions } from '../Actions';
import { Footer } from '../Footer';

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
    return (
        <div className="popup">
            <Header />
            <Main />
            <Actions />
            <Footer />
        </div>
    );
};
