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

import cn from 'classnames';

import { translator } from '../../../../../common/translators/translator';
import { isTransitionAppState } from '../../../state-machines/app-state-machine';
import { popupStore } from '../../../stores/PopupStore';
import { logger } from '../../../../../common/logger';

/**
 * Resume button component props.
 */
type ResumeButtonProps = {
    /**
     * Click handler for the button.
     */
    clickHandler?: () => void;
};

export const ResumeButton = observer(({ clickHandler }: ResumeButtonProps) => {
    const { appState } = useContext(popupStore);

    const isTransition = isTransitionAppState(appState);

    // click handler is not needed during the transition
    // but in other cases it is required
    if (!isTransition && !clickHandler) {
        logger.error('[ext.ResumeButton]: click handler should be defined for the main switcher');
        return null;
    }

    return (
        <div
            className={cn('resume__wrapper', {
                'non-active': isTransitionAppState(appState),
            })}
        >
            <button
                type="button"
                className="button resume__btn"
                onClick={clickHandler}
                title={translator.getMessage('popup_resume_protection_button')}
            >
                {translator.getMessage('popup_resume_protection_button')}
            </button>
        </div>
    );
});
