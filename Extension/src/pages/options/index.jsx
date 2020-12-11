import React from 'react';
import ReactDOM from 'react-dom';

import { Options } from './components/Options';
import { reactTranslator } from '../reactCommon/reactTranslator';

export const optionsPage = {
    init: () => {
        document.title = reactTranslator.translate('options_settings');

        ReactDOM.render(
            <Options />,
            document.getElementById('root'),
        );
    },
};
