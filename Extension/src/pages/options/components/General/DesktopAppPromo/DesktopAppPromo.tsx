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

import { translator } from '../../../../../common/translators/translator';
import { UserAgent } from '../../../../../common/user-agent';
import { Icon } from '../../../../common/components/ui/Icon';
import { rootStore } from '../../../stores/RootStore';
import {
    Forward,
    ForwardAction,
    ForwardFrom,
} from '../../../../../common/forward';
import { TelemetryEventName, TelemetryScreenName } from '../../../../../common/telemetry';
import desktopAppPromoImage from '../../../../../../assets/images/desktop-app-promo.svg';

import styles from './desktop-app-promo.module.pcss';

/**
 * Returns the CTA button text and URL based on user's OS.
 *
 * @returns Object with `text` and `url` properties.
 */
export const getCtaByOs = (): { text: string; url: string } => {
    if (UserAgent.isMacOs) {
        return {
            text: translator.getMessage('options_desktop_app_promo_button_mac'),
            url: Forward.get({
                action: ForwardAction.DesktopAppPromoMac,
                from: ForwardFrom.Options,
            }),
        };
    }

    if (UserAgent.isWindows) {
        return {
            text: translator.getMessage('options_desktop_app_promo_button_windows'),
            url: Forward.get({
                action: ForwardAction.DesktopAppPromoWindows,
                from: ForwardFrom.Options,
            }),
        };
    }

    return {
        text: translator.getMessage('options_desktop_app_promo_button_linux'),
        url: Forward.get({
            action: ForwardAction.DesktopAppPromoLinux,
            from: ForwardFrom.Options,
        }),
    };
};

/**
 * Promo card encouraging users to install the AdGuard desktop app.
 * Shown on the General Settings page in the B-variant of the A/B test (AG-52622).
 * Displays an OS-dependent CTA button (Windows/Mac/Linux) linking to the
 * corresponding product page. Hidden when the user dismisses the promo.
 */
export const DesktopAppPromo = observer(() => {
    const { settingsStore, telemetryStore } = useContext(rootStore);

    if (!settingsStore.showAdguardPromoInfo) {
        return null;
    }

    const { text, url } = getCtaByOs();

    const handleCloseClick = async () => {
        telemetryStore.sendCustomEvent(
            TelemetryEventName.CloseCompareClick,
            TelemetryScreenName.MainPage,
        );
        await settingsStore.hideAdguardPromoInfo();
    };

    return (
        <div className={styles.container}>
            <div>
                <h3 className={styles.title}>
                    {translator.getMessage('options_desktop_app_promo_title')}
                </h3>
                <div className={styles.description}>
                    <p>{translator.getMessage('options_desktop_app_promo_description')}</p>
                    <p>{translator.getMessage('options_desktop_app_promo_subdescription')}</p>
                </div>
                <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(styles.button, 'button', 'button--green-bg', 'button--m')}
                    onClick={() => {
                        telemetryStore.sendCustomEvent(
                            TelemetryEventName.CompareClick,
                            TelemetryScreenName.MainPage,
                        );
                    }}
                >
                    {text}
                </a>
            </div>
            <img
                className={styles.image}
                src={desktopAppPromoImage}
                alt=""
                aria-hidden="true"
            />
            <button
                type="button"
                className={styles.close}
                onClick={handleCloseClick}
                aria-label={translator.getMessage('close_button_title')}
            >
                <Icon
                    id="#cross"
                    className="icon--24 icon--gray-default"
                    aria-hidden="true"
                />
            </button>
        </div>
    );
});
