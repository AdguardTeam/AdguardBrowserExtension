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

import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import classnames from 'classnames';

import { userRulesEditorStore } from './UserRulesEditorStore';
import { Popover } from '../ui/Popover';
import { Icon } from '../ui/Icon';
import { reactTranslator } from '../../../../common/translators/reactTranslator';

/**
 * This button is extracted in the separate file
 * to stop editor re-renderings on wrap mode changes
 */
export const ToggleWrapButton = observer(({ onClick }) => {
    const store = useContext(userRulesEditorStore);

    const lineBreakClassNames = classnames('button actions__btn actions__btn--icon', {
        'actions__btn--active': store.userRulesEditorWrapState,
    });

    const tooltipText = store.userRulesEditorWrapState
        ? reactTranslator.getMessage('options_userfilter_line_break_on')
        : reactTranslator.getMessage('options_userfilter_line_break_off');

    return (
        <Popover text={tooltipText}>
            <button
                type="button"
                className={lineBreakClassNames}
                onClick={onClick}
                aria-label={tooltipText}
            >
                <Icon classname="icon--extend" id="#line-break" />
            </button>
        </Popover>
    );
});
