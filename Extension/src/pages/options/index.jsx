import React from 'react';
import ReactDOM from 'react-dom';
import { SelectProvider } from '../common/components/ui/Select/SelectProvider';
import { reactTranslator } from '../../common/translators/reactTranslator';
import { i18n } from '../../common/translators/i18n';
import { Options } from './components/Options';

export const optionsPage = {
    init: () => {
        document.title = reactTranslator.getMessage('options_settings');
        document.documentElement.lang = i18n.getUILanguage();

        ReactDOM.render(
            <SelectProvider>
                <Options />
            </SelectProvider>,
            document.getElementById('root'),
        );
    },
};
