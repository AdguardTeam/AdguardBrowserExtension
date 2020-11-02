import React from 'react';
import ReactDOM from 'react-dom';
import { App } from './components/App';
import { reactTranslator } from '../reactCommon/reactTranslator';

export const optionsPage = {
    init: () => {
        document.title = reactTranslator.translate('options_settings');

        ReactDOM.render(
            <App />,
            document.getElementById('root'),
        );
    },
};
