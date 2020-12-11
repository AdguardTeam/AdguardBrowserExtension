import React from 'react';
import ReactDOM from 'react-dom';
import { FilteringLog } from './components/FilteringLog';
import { reactTranslator } from '../reactCommon/reactTranslator';

export const filteringLog = {
    init: () => {
        document.title = reactTranslator.translate('filtering_log_title');

        ReactDOM.render(
            <FilteringLog />,
            document.getElementById('root'),
        );
    },
};
