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

import { logger } from '../../../../common/logger';
import { translator } from '../../../../common/translators/translator';
import { Icon } from '../../../common/components/ui/Icon';
import { popupStore } from '../../stores/PopupStore';
import {
    PopupState,
    COMPARE_URL,
    MainSwitcherMode,
} from '../../constants';
import { addMinDelayLoader } from '../../../common/components/helpers';

import './main.pcss';

export const Main = observer(() => {
    const store = useContext(popupStore);

    const {
        currentSite,
        currentStatus,
        popupState,
        showInfoAboutFullVersion,
        areFilterLimitsExceeded,
    } = store;

    if (!currentStatus) {
        logger.error('Popup status message is not defined');
        return null;
    }

    if (!currentSite) {
        logger.debug('Current site is not defined yet');
    }

    const toggleAllowlistedHandler = __IS_MV3__
        ? addMinDelayLoader(
            store.setShowLoader,
            store.toggleAllowlistedMv3,
        )
        : store.toggleAllowlisted;

    const enableFilteringHandler = addMinDelayLoader(
        store.setShowLoader,
        async () => {
            await store.changeApplicationFilteringDisabled(false);
        },
    );

    const switchersMap = {
        [PopupState.ApplicationEnabled]: {
            handler: toggleAllowlistedHandler,
            mode: MainSwitcherMode.Enabled,
        },
        [PopupState.ApplicationFilteringDisabled]: {
            handler: enableFilteringHandler,
            mode: MainSwitcherMode.Disabled,
        },
        [PopupState.ApplicationUnavailable]: {
            mode: MainSwitcherMode.Unavailable,
        },
        [PopupState.SiteInException]: {
            mode: MainSwitcherMode.InException,
        },
        [PopupState.SiteAllowlisted]: {
            handler: toggleAllowlistedHandler,
            mode: MainSwitcherMode.Allowlisted,
        },
    };

    const switcher = switchersMap[popupState];

    if (!switcher) {
        logger.error(`Unknown popup state: ${popupState}`);
        return null;
    }

    const mainClassNames = `main main--${switcher.mode}`;

    if (!store.isInitialDataReceived) {
        return <div className={mainClassNames} />;
    }

    return (
        <div className={mainClassNames}>
            <div className="main__header">
                <div className="main__header--current-status--title">
                    {currentStatus.title}
                </div>
                <div
                    className="main__header--current-site"
                    title={currentSite || ''}
                >
                    {currentSite}
                </div>
                {currentStatus?.description && (
                    <div className="main__header--current-status--description">
                        {currentStatus.description}
                    </div>
                )}
                { areFilterLimitsExceeded && __IS_MV3__ && (
                    <div className="main__header--limits-exceeded">
                        {translator.getMessage('popup_limits_exceeded_warning')}
                    </div>
                )}
            </div>

            <div className="switcher__wrapper">
                <button
                    type="button"
                    className="switcher"
                    // TODO: handle later
                    // @ts-ignore
                    onClick={switcher.handler}
                    title={translator.getMessage('popup_switch_button')}
                >
                    <div className={`switcher__center switcher__center--${switcher.mode}`} />
                    <div className="switcher__btn">
                        {/* enabled switcher state */}
                        <Icon id="#checkmark" classname="icon--24 switcher__icon switcher__icon--checkmark" />
                        {/* disabled switcher state */}
                        <Icon id="#circle" classname="icon--24 switcher__icon switcher__icon--circle" />
                    </div>
                </button>
            </div>

            {popupState === PopupState.ApplicationFilteringDisabled && (
                <div className="switcher__resume--wrapper">
                    <button
                        type="button"
                        className="button switcher__resume--btn"
                        onClick={enableFilteringHandler}
                        title={translator.getMessage('popup_resume_protection_button')}
                    >
                        {translator.getMessage('popup_resume_protection_button')}
                    </button>
                </div>
            )}

            {popupState === PopupState.ApplicationUnavailable && (
                <div className="switcher__no-filtering">
                    <Icon id="#secure-page" classname="icon--no-filtering" />
                </div>
            )}

            {popupState === PopupState.SiteInException && (
                <div className="switcher__no-filtering">
                    <Icon id="#lock" classname="icon--no-filtering" />
                </div>
            )}

            {showInfoAboutFullVersion && (
                <div className="main__cta">
                    <a
                        href={COMPARE_URL}
                        target="_blank"
                        rel="noreferrer"
                        className="main__cta--link"
                    >
                        {translator.getMessage('popup_header_cta_link')}
                    </a>
                </div>
            )}
        </div>
    );
});
