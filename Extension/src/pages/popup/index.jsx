import React from 'react';
import ReactDOM from 'react-dom';

import { Popup } from './components/Popup';

export const popupPage = {
    init: () => {
        ReactDOM.render(
            <Popup />,
            document.getElementById('root'),
        );
    },
};
