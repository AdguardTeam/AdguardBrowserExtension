import React from 'react';
import ReactDOM from 'react-dom';
import { reactTranslator } from '../../common/translators/reactTranslator';
import { i18n } from '../../common/translators/i18n';
import { FullscreenUserRules } from './components/fullscreen-user-rules';

export const fullscreenUserRulesPage = {
    init: () => {
        document.title = reactTranslator.getMessage('fullscreen_user_rules_title');
        document.documentElement.lang = i18n.getUILanguage();

        ReactDOM.render(
            <FullscreenUserRules />,
            document.getElementById('root'),
        );
    },
};
