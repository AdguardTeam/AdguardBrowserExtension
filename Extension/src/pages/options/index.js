import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'mobx-react';
import App from './components/App';
import i18n from '../services/i18n';

export const optionsPage = {
    init: () => {
        document.title = i18n.translate('options_settings');

        ReactDOM.render(
            <Provider>
                <App />
            </Provider>,
            document.getElementById('root'),
        );
    },
};
