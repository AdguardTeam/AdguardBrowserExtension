import React from 'react';
import ReactDOM from 'react-dom';

import { Options } from './components/Options';
import { i18n } from '../services/i18n';

export const optionsPage = {
    init: () => {
        document.title = i18n.translate('options_settings');

        ReactDOM.render(
            <Options />,
            document.getElementById('root'),
        );
    },
};
