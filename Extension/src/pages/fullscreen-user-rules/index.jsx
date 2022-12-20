/**
 * @file
 * This file is part of AdGuard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * AdGuard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * AdGuard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with AdGuard Browser Extension. If not, see <http://www.gnu.org/licenses/>.
 */

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
