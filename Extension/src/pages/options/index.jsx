import React from 'react';
import ReactDOM from 'react-dom';

import { Options } from './components/Options';
import { SelectProvider } from '../common/components/ui/Select/SelectProvider';
import { reactTranslator } from '../../common/translators/reactTranslator';

export const optionsPage = {
    init: () => {
        document.title = reactTranslator.getMessage('options_settings');

        ReactDOM.render(
            <SelectProvider>
                <Options />
            </SelectProvider>,
            document.getElementById('root'),
        );
    },
};
