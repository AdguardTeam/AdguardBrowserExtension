/**
 * Copyright (c) 2015-2026 Adguard Software Ltd.
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

import { translator } from '../../../../common/translators/translator';
import { messenger } from '../../../services/messenger';
import { CloseIcon } from '../../../common/components/ui/CloseIcon';
import { rootStore } from '../../stores/RootStore';
import { TelemetryEventName, TelemetryScreenName } from '../../../../common/telemetry';

import styles from './rate-notification.module.pcss';

/**
 * Notification prompting users to rate the extension.
 * Renders as a card in the options page sidebar.
 */
export const RateNotification = observer(() => {
    const { settingsStore, telemetryStore } = useContext(rootStore);

    if (!settingsStore.rateShowState) {
        return null;
    }

    const hideRate = () => {
        telemetryStore.sendCustomEvent(
            TelemetryEventName.CloseRateUsClick,
            TelemetryScreenName.MainPage,
        );
        settingsStore.hideRateShow();
    };

    const handleRateClick = async () => {
        telemetryStore.sendCustomEvent(
            TelemetryEventName.RateUsClick,
            TelemetryScreenName.MainPage,
        );

        await messenger.openExtensionStore();
        settingsStore.hideRateShow();
    };

    return (
        <div role="alert" className={styles.container}>
            <div className={styles.description}>
                {translator.getMessage('options_do_you_like_question')}
            </div>
            <button
                type="button"
                className={cn(styles.rateButton, 'button', 'button--green-bg', 'button--m')}
                onClick={handleRateClick}
            >
                {translator.getMessage('options_rate_us_cta')}
            </button>
            <button
                type="button"
                className={styles.close}
                onClick={hideRate}
                aria-label={translator.getMessage('close_button_title')}
            >
                <CloseIcon />
            </button>
        </div>
    );
});
