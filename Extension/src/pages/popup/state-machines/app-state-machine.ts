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

import { createActor, setup } from 'xstate';

import { logger } from '../../../common/logger';

/**
 * Popup state machine states.
 */
export const enum AppState {
    /**
     * Loading state right after the popup is opened.
     *
     * Used as an initial state.
     */
    Loading = 'Loading',

    /**
     * Transition state when the protection **is being disabled**.
     */
    Disabling = 'Disabling',

    /**
     * Non-transition state when the protection **is disabled**.
     */
    Disabled = 'Disabled',

    /**
     * Transition state when the protection **is being enabled**.
     */
    Enabling = 'Enabling',

    /**
     * Non-transition state when the protection **is enabled**.
     */
    Enabled = 'Enabled',

    /**
     * Transition state when the protection **is being paused**.
     */
    Pausing = 'Pausing',

    /**
     * Non-transition state when the protection **is paused**.
     */
    Paused = 'Paused',

    /**
     * Transition state when the protection **is being resumed**.
     */
    Resuming = 'Resuming',
}

/**
 * List of states that are considered as transition states.
 */
const TRANSITION_STATES = [
    AppState.Enabling,
    AppState.Disabling,
    AppState.Pausing,
    AppState.Resuming,
];

/**
 * Popup state machine events.
 */
export const enum AppStateEvent {
    /**
     * Enable the filtering.
     */
    Enable = 'Enable',

    /**
     * Disable the filtering, i.e. allowlist a website.
     */
    Disable = 'Disable',

    /**
     * Pause the filtering, i.e. disable the filtering for all websites.
     */
    Pause = 'Pause',

    /**
     * Resume the filtering.
     */
    Resume = 'Resume',

    /**
     * Success event for the enabling state.
     */
    EnableSuccess = 'EnableSuccess',

    /**
     * Success event for the disabling state.
     */
    DisableSuccess = 'DisableSuccess',

    /**
     * Success event for the pausing state.
     */
    PauseSuccess = 'PauseSuccess',

    /**
     * Success event for the resuming, assumed the filtering will be enabled.
     */
    ResumeSuccess = 'ResumeSuccess',

    /**
     * Fail event for the resuming, assumed the filtering will be disabled.
     */
    ResumeFail = 'ResumeFail',
}

/**
 * App state machine event type.
 */
type EventType = {
    type: AppStateEvent;
};

const APP_STATE_MACHINE_ID = 'appState';

/**
 * Minimal delay for the `pausing` state to make it seen by the user
 * because the `paused` state may be shown too fast.
 */
const MIN_PAUSING_DELAY_MS = 500;

/**
 * App state machine.
 */
const appStateMachine = setup({
    types: {} as { events: EventType },
    delays: {
        PAUSING_DELAY: MIN_PAUSING_DELAY_MS,
    },
}).createMachine({
    id: APP_STATE_MACHINE_ID,
    initial: AppState.Loading,
    states: {
        [AppState.Loading]: {
            on: {
                [AppStateEvent.Enable]: {
                    target: AppState.Enabled,
                },
                [AppStateEvent.Disable]: {
                    target: AppState.Disabled,
                },
                [AppStateEvent.Pause]: {
                    target: AppState.Paused,
                },
            },
        },
        [AppState.Enabled]: {
            on: {
                [AppStateEvent.Disable]: {
                    target: AppState.Disabling,
                },
                [AppStateEvent.Pause]: {
                    target: AppState.Pausing,
                },
            },
        },
        [AppState.Disabled]: {
            on: {
                [AppStateEvent.Enable]: {
                    target: AppState.Enabling,
                },
                [AppStateEvent.Pause]: {
                    target: AppState.Pausing,
                },
            },
        },
        [AppState.Paused]: {
            on: {
                [AppStateEvent.Resume]: {
                    target: AppState.Resuming,
                },
            },
        },
        [AppState.Enabling]: {
            on: {
                [AppStateEvent.EnableSuccess]: {
                    target: AppState.Enabled,
                },
            },
        },
        [AppState.Disabling]: {
            on: {
                [AppStateEvent.DisableSuccess]: {
                    target: AppState.Disabled,
                },
            },
        },
        [AppState.Pausing]: {
            after: {
                PAUSING_DELAY: {
                    target: AppState.Paused,
                },
            },
        },
        [AppState.Resuming]: {
            on: {
                [AppStateEvent.ResumeSuccess]: {
                    target: AppState.Enabled,
                },
                [AppStateEvent.ResumeFail]: {
                    target: AppState.Disabled,
                },
            },
        },
    },
});

const appStateActor = createActor(appStateMachine);

appStateActor.subscribe((state) => {
    logger.trace('[ext.app-state-machine]: current state:', { id: APP_STATE_MACHINE_ID, currentState: state.value });
});

appStateActor.start();

export { appStateActor };

/**
 * Checks whether the state is a transition state,
 * e.g. _Enabling_ or _Disabling_, not _Enabled_ or _Disabled_.
 *
 * @param state State to check.
 *
 * @returns `true` if the state is a transition state, `false` otherwise.
 */
export const isTransitionAppState = (state: AppState): boolean => {
    return TRANSITION_STATES.includes(state);
};
