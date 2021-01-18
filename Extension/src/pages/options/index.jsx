import React from 'react';
import ReactDOM from 'react-dom';

import { Options } from './components/Options';
import { reactTranslator } from '../../common/translators/reactTranslator';

export const optionsPage = {
    init: () => {
        document.title = reactTranslator.getMessage('options_settings');

        ReactDOM.render(
            <Options />,
            document.getElementById('root'),
        );
    },
};
