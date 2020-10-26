import React from 'react';
import ReactDOM from 'react-dom';
import { App } from './components/App';
import { reactTranslator } from '../reactCommon/reactTranslator';

export const filteringLog = {
    init: () => {
        document.title = reactTranslator.translate('filtering_log_title');

        ReactDOM.render(
            <App />,
            document.getElementById('root'),
        );
    },
};
