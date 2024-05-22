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

import classnames from 'classnames';

import { SavingFSMState } from '../Editor/savingFSM';
import { translator } from '../../../../common/translators/translator';
import { Icon } from '../ui/Icon';

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
            <Icon id="#tick" classname="icon--checked editor__icon" />
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
            {renderSavingState(savingState)}
            <button
                type="button"
                className="button button--m button--green actions__btn"
                onClick={onClick}
                disabled={!contentChanged}
            >
                {translator.getMessage('options_editor_save')}
            </button>
        </div>
    );
};
