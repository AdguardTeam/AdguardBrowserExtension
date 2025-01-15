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
import { popupStore } from '../../stores/PopupStore';
import { AppState } from '../../state-machines/app-state-machine';
import { COMPARE_URL, SpecificPopupState } from '../../constants';

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
    TitleAriaVisible = 'TitleAriaVisible',
    Subtitle = 'Subtitle',
    SubtitleAriaVisible = 'SubtitleAriaVisible',
    ButtonHandler = 'ButtonHandler',
    SwitcherOn = 'SwitcherOn',
    Status = 'Status',
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
     * Flag for the title to be visible for screen readers.
     */
    [AppStateField.TitleAriaVisible]?: boolean;

    /**
     * State subtitle.
     */
    [AppStateField.Subtitle]?: string;

    /**
     * Flag for the subtitle to be visible for screen readers.
     */
    [AppStateField.SubtitleAriaVisible]?: boolean;

    /**
     * Handler for the button.
     */
    [AppStateField.ButtonHandler]?: () => void;

    /**
     * Flag for the main switcher. If it's not defined, the switcher is not shown.
     */
    [AppStateField.SwitcherOn]?: boolean;

    /**
     * Status of the state.
     */
    [AppStateField.Status]?: string;
};

export const Main = observer(() => {
    // FIXME: Improve a11y
    const store = useContext(popupStore);

    const {
        currentSite,
        currentEnabledTitle,
        currentDisabledTitle,
        totalBlocked,
        specificPopupState,
        showInfoAboutFullVersion,
        appState,
        toggleAllowlisted,
        resumeApplicationFiltering,
    } = store;

    const currentSiteLabel = `${translator.getMessage('popup_tab_current_website')}: `;

    if (!currentSite) {
        logger.debug('Current site is not defined yet');
    }

    const totalBlockedSubtitle = translator.getMessage('popup_tab_blocked_all_count', {
        num: totalBlocked.toLocaleString(),
    });
    const pausedTitle = translator.getMessage('popup_site_filtering_state_paused');
    const forAllWebsitesSubtitle = translator.getMessage('popup_site_filtering_state_subtitle_all_websites');

    /**
     * Map of the app states to the data to render.
     *
     * Notes about A11Y:
     * - Do not show title and subtitle for screen readers if they represents information
     *   about current state. It's already announced by the screen reader using `AppStateField.Status`.
     *   Currently, we show only information about blocked requests for title and total blocked requests
     *   for subtitle.
     *
     * - Do not add `AppStateField.Status` for intermediate states (eg. 'Enabling', 'Disabling', etc.),
     *   because these actions happens pretty fast and screen reader will not have time to announce it.
     *   You can add state if it takes a long time to complete (> 1s).
     */
    const statesMap: Record<AppState, AppStateData | null> = {
        [AppState.Loading]: null,
        [AppState.Disabling]: {
            [AppStateField.Title]: translator.getMessage('popup_site_filtering_state_disabling'),
            [AppStateField.Subtitle]: totalBlockedSubtitle,
            [AppStateField.SubtitleAriaVisible]: true,
            [AppStateField.SwitcherOn]: false,
        },
        [AppState.Disabled]: {
            [AppStateField.Title]: currentDisabledTitle,
            [AppStateField.Subtitle]: totalBlockedSubtitle,
            [AppStateField.SubtitleAriaVisible]: true,
            [AppStateField.ButtonHandler]: toggleAllowlisted,
            [AppStateField.SwitcherOn]: false,
            [AppStateField.Status]: translator.getMessage('popup_site_filtering_state_disabled'), // FIXME: Secure page
        },
        [AppState.Enabling]: {
            [AppStateField.Title]: translator.getMessage('popup_site_filtering_state_enabling'),
            [AppStateField.Subtitle]: totalBlockedSubtitle,
            [AppStateField.SubtitleAriaVisible]: true,
            [AppStateField.SwitcherOn]: true,
        },
        [AppState.Enabled]: {
            [AppStateField.Title]: currentEnabledTitle,
            [AppStateField.TitleAriaVisible]: true,
            [AppStateField.Subtitle]: totalBlockedSubtitle,
            [AppStateField.SubtitleAriaVisible]: true,
            [AppStateField.ButtonHandler]: toggleAllowlisted,
            [AppStateField.SwitcherOn]: true,
            [AppStateField.Status]: translator.getMessage('popup_site_filtering_state_enabled'), // FIXME: Secure page
        },
        [AppState.Pausing]: {
            [AppStateField.Title]: translator.getMessage('popup_site_filtering_state_pausing'),
            [AppStateField.Subtitle]: forAllWebsitesSubtitle,
        },
        [AppState.Paused]: {
            [AppStateField.Title]: pausedTitle,
            [AppStateField.Subtitle]: forAllWebsitesSubtitle,
            [AppStateField.ButtonHandler]: resumeApplicationFiltering,
            [AppStateField.Status]: `${pausedTitle} ${forAllWebsitesSubtitle}`,
        },
        [AppState.Resuming]: {
            [AppStateField.Title]: translator.getMessage('popup_site_filtering_state_resuming'),
            [AppStateField.Subtitle]: forAllWebsitesSubtitle,
        },
    };

    const state = statesMap[appState];

    if (!state) {
        logger.debug(`No info state: ${appState}`);
        return null;
    }

    const isResumeButtonVisible = appState === AppState.Paused
        || appState === AppState.Pausing
        || appState === AppState.Resuming;

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

        logger.debug('No component for the current app state');
        return null;
    };

    return (
        <div className="main">
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
                    aria-hidden={!state[AppStateField.TitleAriaVisible]}
                >
                    {state[AppStateField.Title]}
                </div>
                <div
                    className="main__header--current-status--subtitle"
                    title={state[AppStateField.Subtitle]}
                    aria-hidden={!state[AppStateField.SubtitleAriaVisible]}
                >
                    {state[AppStateField.Subtitle]}
                </div>
            </div>

            <div role="status" className="sr-only" aria-live="polite">
                {state[AppStateField.Status]}
            </div>

            <div className="main__control">{getCentralControlByState()}</div>

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
