import React from 'react';
import ReactDOM from 'react-dom';

import { reactTranslator } from '../../common/translators/reactTranslator';
import { FullscreenUserRules } from './components/fullscreen-user-rules';

export const fullscreenUserRulesPage = {
    init: () => {
        document.title = reactTranslator.getMessage('fullscreen_user_rules_title');

        ReactDOM.render(
            <FullscreenUserRules />,
            document.getElementById('root'),
        );
    },
};
