import React from 'react';
import ReactDOM from 'react-dom';
import { reactTranslator } from '../../common/translators/reactTranslator';
import { i18n } from '../../common/translators/i18n';
import { FilteringLog } from './components/FilteringLog';

export const filteringLog = {
    init: () => {
        document.title = reactTranslator.getMessage('filtering_log_title');
        document.documentElement.lang = i18n.getUILanguage();

        ReactDOM.render(
            <FilteringLog />,
            document.getElementById('root'),
        );
    },
};
