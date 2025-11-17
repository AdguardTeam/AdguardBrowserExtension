/**
 * Copyright (c) 2015-2025 Adguard Software Ltd.
 *
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

import { Popover } from '../ui/Popover';
import { Icon } from '../ui/Icon';
import { translator } from '../../../../common/translators/translator';

import { userRulesEditorStore } from './UserRulesEditorStore';

/**
 * This button is extracted in the separate file
 * to stop editor re-renderings on wrap mode changes
 */
export const ToggleWrapButton = observer(({ onClick }) => {
    const store = useContext(userRulesEditorStore);

    const lineBreakClassNames = classnames('button actions__btn actions__btn--icon', {
        'actions__btn--active': store.userRulesEditorWrapState,
    });

    const iconId = store.userRulesEditorWrapState ? '#line-break-on' : '#line-break-off';

    const tooltipText = store.userRulesEditorWrapState
        ? translator.getMessage('options_userfilter_line_break_on')
        : translator.getMessage('options_userfilter_line_break_off');

    return (
        <Popover text={tooltipText}>
            <button
                type="button"
                role="switch"
                className={lineBreakClassNames}
                onClick={onClick}
                aria-checked={store.userRulesEditorWrapState}
                aria-label={translator.getMessage('options_userfilter_line_break')}
            >
                <Icon
                    id={iconId}
                    className="icon--24 icon--gray-default"
                    aria-hidden="true"
                />
            </button>
        </Popover>
    );
});
