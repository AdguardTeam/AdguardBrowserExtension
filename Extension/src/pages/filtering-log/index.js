import React from 'react';
import ReactDOM from 'react-dom';
import { FilteringLog } from './components/FilteringLog';
import { reactTranslator } from '../../common/translators/reactTranslator';

export const filteringLog = {
    init: () => {
        document.title = reactTranslator.getMessage('filtering_log_title');

        ReactDOM.render(
            <FilteringLog />,
            document.getElementById('root'),
        );
    },
};
