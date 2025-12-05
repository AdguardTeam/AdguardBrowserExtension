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

import React from 'react';

import classnames from 'classnames';

import { SavingFSMState } from '../Editor/savingFSM';
import { translator } from '../../../../common/translators/translator';
import { Icon } from '../ui/Icon';
import { UserAgent } from '../../../../common/user-agent';

const renderSavingState = (savingRulesState: SavingFSMState) => {
    type IndicatorTextMapType = {
        [key in SavingFSMState]: string | null;
    };

    const indicatorTextMap: IndicatorTextMapType = {
        [SavingFSMState.Idle]: null,
        [SavingFSMState.Saved]: translator.getMessage('options_editor_indicator_saved'),
        [SavingFSMState.Saving]: translator.getMessage('options_editor_indicator_saving'),
    };

    const indicatorText = indicatorTextMap[savingRulesState as SavingFSMState];

    if (!indicatorText) {
        return null;
    }

    const indicatorClassnames = classnames('editor__label', {
        'editor__label--saved': savingRulesState === SavingFSMState.Saved,
    });

    return (
        <div className={indicatorClassnames}>
            {/* TODO: check editor__icon styles later, it may no longer be needed */}
            <Icon
                id="#tick"
                className="icon--18 icon--green-default editor__icon"
                aria-hidden="true"
            />
            {indicatorText}
        </div>
    );
};

type SavingButtonParams = {
    /**
     * Click handler.
     */
    onClick: () => void;

    /**
     * Saving state.
     */
    savingState: SavingFSMState;

    /**
     * Indicates if content has changed.
     */
    contentChanged: boolean;
};

export const SavingButton = ({ onClick, savingState, contentChanged }: SavingButtonParams) => {
    return (
        <div className="actions__saving">
            {!__IS_MV3__ && renderSavingState(savingState)}
            <button
                type="button"
                className="button button--l button--green-bg actions__btn actions__btn--saving"
                onClick={onClick}
                title={translator.getMessage('options_editor_save')}
                disabled={!contentChanged}
                aria-keyshortcuts={UserAgent.isMacOs ? 'Meta+S' : 'Ctrl+S'}
            >
                {translator.getMessage('options_editor_save')}
            </button>
        </div>
    );
};
