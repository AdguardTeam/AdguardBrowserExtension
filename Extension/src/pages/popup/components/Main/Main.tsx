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

import classNames from 'classnames';

import { logger } from '../../../../common/logger';
import { translator } from '../../../../common/translators/translator';
import { popupStore } from '../../stores/PopupStore';
import { AppState } from '../../state-machines/app-state-machine';
import { COMPARE_URL, SpecificPopupState } from '../../constants';
import { TelemetryEventName, TelemetryScreenName } from '../../../../background/services';

import {
    MainSwitch,
    NoFiltering,
    ResumeButton,
} from './StateComponents';

import './main.pcss';

/**
 * Fields for the app state data to render.
 */
enum AppStateField {
    Title = 'Title',
    Subtitle = 'Subtitle',
    ButtonHandler = 'ButtonHandler',
    SwitcherOn = 'SwitcherOn',
}

/**
 * Data for each state to render.
 */
type AppStateData = {
    /**
     * State title.
     */
    [AppStateField.Title]: string;

    /**
     * State subtitle.
     */
    [AppStateField.Subtitle]?: string;

    /**
     * Handler for the button.
     */
    [AppStateField.ButtonHandler]?: () => void;

    /**
     * Flag for the main switcher. If it's not defined, the switcher is not shown.
     */
    [AppStateField.SwitcherOn]?: boolean;
};

export const Main = observer(() => {
    const store = useContext(popupStore);

    const {
        currentSite,
        currentEnabledTitle,
        currentDisabledTitle,
        totalBlocked,
        specificPopupState,
        showInfoAboutFullVersion,
        appState,
        hasUserRulesToReset,
        toggleAllowlisted,
        resumeApplicationFiltering,
        telemetryStore,
    } = store;

    const classes = classNames('main', {
        'main--has-user-rules': hasUserRulesToReset,
    });

    const currentSiteLabel = `${translator.getMessage('popup_tab_current_website')}: `;

    if (!currentSite) {
        logger.info('[ext.Main]: current site is not defined yet');
    }

    const totalBlockedSubtitle = translator.getMessage('popup_tab_blocked_all_count', {
        num: totalBlocked.toLocaleString(),
    });

    const statesMap: Record<AppState, AppStateData | null> = {
        [AppState.Loading]: null,
        [AppState.Disabling]: {
            [AppStateField.Title]: translator.getMessage('popup_site_filtering_state_disabling'),
            [AppStateField.Subtitle]: totalBlockedSubtitle,
            [AppStateField.SwitcherOn]: false,
        },
        [AppState.Disabled]: {
            [AppStateField.Title]: currentDisabledTitle,
            [AppStateField.Subtitle]: totalBlockedSubtitle,
            [AppStateField.ButtonHandler]: toggleAllowlisted,
            [AppStateField.SwitcherOn]: false,
        },
        [AppState.Enabling]: {
            [AppStateField.Title]: translator.getMessage('popup_site_filtering_state_enabling'),
            [AppStateField.Subtitle]: totalBlockedSubtitle,
            [AppStateField.SwitcherOn]: true,
        },
        [AppState.Enabled]: {
            [AppStateField.Title]: currentEnabledTitle,
            [AppStateField.Subtitle]: totalBlockedSubtitle,
            [AppStateField.ButtonHandler]: toggleAllowlisted,
            [AppStateField.SwitcherOn]: true,
        },
        [AppState.Pausing]: {
            [AppStateField.Title]: translator.getMessage('popup_site_filtering_state_pausing'),
            [AppStateField.Subtitle]: translator.getMessage('popup_site_filtering_state_subtitle_all_websites'),
        },
        [AppState.Paused]: {
            [AppStateField.Title]: translator.getMessage('popup_site_filtering_state_paused'),
            [AppStateField.Subtitle]: translator.getMessage('popup_site_filtering_state_subtitle_all_websites'),
            [AppStateField.ButtonHandler]: resumeApplicationFiltering,
        },
        [AppState.Resuming]: {
            [AppStateField.Title]: translator.getMessage('popup_site_filtering_state_resuming'),
            [AppStateField.Subtitle]: translator.getMessage('popup_site_filtering_state_subtitle_all_websites'),
        },
    };

    const state = statesMap[appState];

    if (!state) {
        logger.info('[ext.Main]: no info state: ', appState);
        return null;
    }

    const isResumeButtonVisible = appState === AppState.Paused
        || appState === AppState.Pausing
        || appState === AppState.Resuming;

    /**
     * Telemetry for "How to enhance protection" link.
     */
    const handleHowToEnhanceClick = () => {
        telemetryStore.sendCustomEvent(
            TelemetryEventName.HowToEnhanceClick,
            TelemetryScreenName.MainPage,
        );
    };

    /**
     * Returns a component for the current app state.
     *
     * @returns Current state component.
     */
    const getCentralControlByState = () => {
        // specific popup states should be checked first
        // because whether the filtering is enabled (or not) is not relevant in these cases
        if (
            specificPopupState === SpecificPopupState.SiteInException
            && !isResumeButtonVisible
        ) {
            return (
                <div className="main__site-exception">
                    {translator.getMessage('popup_site_exception_information')}
                </div>
            );
        }

        if (
            specificPopupState === SpecificPopupState.FilteringUnavailable
            || specificPopupState === SpecificPopupState.SiteInException
        ) {
            return <NoFiltering />;
        }

        if (typeof state[AppStateField.SwitcherOn] !== 'undefined') {
            return (
                <MainSwitch
                    isEnabled={state[AppStateField.SwitcherOn]}
                    clickHandler={state[AppStateField.ButtonHandler]}
                />
            );
        }

        if (isResumeButtonVisible) {
            return <ResumeButton clickHandler={state[AppStateField.ButtonHandler]} />;
        }

        logger.info('[ext.Main]: no component for the current app state: ', appState);
        return null;
    };

    return (
        <div className={classes}>
            <div className="main__header">
                <div
                    className="main__header--current-site"
                    title={`${currentSiteLabel}${currentSite}`}
                >
                    <span className="sr-only">{currentSiteLabel}</span>
                    {currentSite}
                </div>
                <div
                    className="main__header--current-status--title"
                    title={state[AppStateField.Title]}
                >
                    {state[AppStateField.Title]}
                </div>
                <div
                    className="main__header--current-status--subtitle"
                    title={state[AppStateField.Subtitle]}
                >
                    {state[AppStateField.Subtitle]}
                </div>
            </div>

            <div className="main__control">{getCentralControlByState()}</div>

            {showInfoAboutFullVersion && (
                <div className="main__cta">
                    <a
                        href={COMPARE_URL}
                        target="_blank"
                        rel="noreferrer"
                        className="main__cta--link"
                        onClick={handleHowToEnhanceClick}
                    >
                        {translator.getMessage('popup_header_cta_link')}
                    </a>
                </div>
            )}
        </div>
    );
});
