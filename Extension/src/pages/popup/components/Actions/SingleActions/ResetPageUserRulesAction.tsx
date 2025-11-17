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

import React, { useState } from 'react';

import { addMinDurationTime } from '../../../../../common/sleep-utils';
import { translator } from '../../../../../common/translators/translator';
import { messenger } from '../../../../services/messenger';
import { Icon } from '../../../../common/components/ui/Icon';
import { MIN_USER_RULES_REMOVAL_DISPLAY_DURATION_MS } from '../../../../common/constants';
import { logger } from '../../../../../common/logger';

import { type SingleActionParams } from './types';

import '../actions.pcss';

export const ResetPageUserRulesAction = ({ className, isFilteringPossible, url }: SingleActionParams) => {
    const [removingUserRules, clearingUserRules] = useState(false);

    const title = translator.getMessage('popup_reset_page_user_rules');

    /**
     * Sends a message to the background to remove user rules for a page by `url`.
     */
    const removeUserRulesWithMinDuration = addMinDurationTime(
        messenger.resetUserRulesForPage,
        MIN_USER_RULES_REMOVAL_DISPLAY_DURATION_MS,
    );

    /**
     * Handle reset page user rules action click.
     */
    const handlePageUserRulesReset = async () => {
        if (!url) {
            logger.error('[ext.ResetPageUserRulesAction]: no URL provided for page user rules reset');
            return;
        }

        if (!isFilteringPossible) {
            return;
        }
        clearingUserRules(true);
        await removeUserRulesWithMinDuration(url);
        window.close();
    };

    let removeUserRulesIconId = '#small-cross';
    let removeUserRulesIconClassname = 'icon--24 icon--action--small-cross';

    if (removingUserRules) {
        removeUserRulesIconId = '#popup-loading';
        removeUserRulesIconClassname = 'icon--24 icon--action--loading';
    }

    return (
        <button
            type="button"
            className={className}
            title={title}
            disabled={removingUserRules}
            onClick={handlePageUserRulesReset}
        >
            <Icon
                id={removeUserRulesIconId}
                className={removeUserRulesIconClassname}
                animationCondition={removingUserRules}
                animationClassName="icon--loading"
                aria-hidden="true"
            />
            <span className="action__title">
                {title}
            </span>
        </button>
    );
};
