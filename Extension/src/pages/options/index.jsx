import React from 'react';
import ReactDOM from 'react-dom';
import { App } from './components/App';
import { i18n } from '../services';

export const optionsPage = {
    init: () => {
        document.title = i18n.translate('options_settings');

        ReactDOM.render(
            <App />,
            document.getElementById('root'),
        );
    },
};
