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

import React, { useContext, useState } from 'react';
import { observer } from 'mobx-react';

import cn from 'classnames';

import { messenger } from '../../../services/messenger';
import { popupStore } from '../../stores/PopupStore';
import { reactTranslator } from '../../../../common/translators/reactTranslator';
import { Icon } from '../../../common/components/ui/Icon';
import { ForwardFrom } from '../../../../common/forward';
import { addMinDurationTime } from '../../../../common/common-script';
import { MIN_USER_RULES_REMOVAL_DISPLAY_DURATION_MS } from '../../../common/constants';

import './actions.pcss';

export const Actions = observer(() => {
    const store = useContext(popupStore);
    const [removingUserRules, clearingUserRules] = useState(false);

    const removeUserRulesWithMinDuration = addMinDurationTime(
        messenger.resetCustomRulesForPage,
        MIN_USER_RULES_REMOVAL_DISPLAY_DURATION_MS,
    );

    const resetCustomRulesForPage = async () => {
        if (!store.applicationAvailable) {
            return;
        }
        clearingUserRules(true);
        await removeUserRulesWithMinDuration(store.url);
        window.close();
    };

    const handleBlockAds = () => {
        if (!store.applicationAvailable) {
            return;
        }
        messenger.openAssistant();
        window.close();
    };

    const handleOpenFilteringLog = () => {
        messenger.openFilteringLog();
        window.close();
    };

    const handleAbuseSite = () => {
        if (!store.applicationAvailable) {
            return;
        }
        messenger.openAbuseSite(store.url, ForwardFrom.Popup);
        window.close();
    };

    const handleCheckSiteSecurity = () => {
        if (!store.applicationAvailable) {
            return;
        }
        messenger.checkSiteSecurity(store.url, ForwardFrom.Popup);
        window.close();
    };

    const actionChangingClassname = cn('action', { action_disabled: !store.applicationAvailable });

    const removeUserRulesIconId = removingUserRules ? '#removing-user-rules' : '#small-cross';

    return (
        <div className="actions">
            <button
                type="button"
                className={actionChangingClassname}
                onClick={handleBlockAds}
            >
                <Icon
                    id="#block-ad"
                    classname="icon--action"
                />
                <div className="action-title">
                    {reactTranslator.getMessage('popup_block_site_ads_option')}
                </div>
            </button>
            <button
                type="button"
                className="action"
                onClick={handleOpenFilteringLog}
            >
                <Icon
                    id="#sandwich"
                    classname="icon--action"
                />
                <div className="action-title">
                    {reactTranslator.getMessage('popup_open_filtering_log')}
                </div>
            </button>
            <button
                type="button"
                className={actionChangingClassname}
                onClick={handleAbuseSite}
            >
                <Icon
                    id="#thumb-down"
                    classname="icon--action"
                />
                <div className="action-title">
                    {reactTranslator.getMessage('popup_abuse_site')}
                </div>
            </button>
            <button
                type="button"
                className={actionChangingClassname}
                onClick={handleCheckSiteSecurity}
            >
                <Icon
                    id="#shield"
                    classname="icon--action"
                />
                <div className="action-title">
                    {reactTranslator.getMessage('popup_security_report')}
                </div>
            </button>
            { store.hasCustomRulesToReset
            && (
                <button
                    type="button"
                    className={actionChangingClassname}
                    onClick={resetCustomRulesForPage}
                    disabled={removingUserRules}
                >
                    <Icon
                        id={removeUserRulesIconId}
                        classname="icon--action"
                        animationCondition={removingUserRules}
                        animationClassname="icon--loading"
                    />
                    <div
                        className="action-title"
                        title={reactTranslator.getMessage('popup_reset_custom_rules')}
                    >
                        {reactTranslator.getMessage('popup_reset_custom_rules')}
                    </div>
                </button>
            )}
        </div>
    );
});
