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

import { translator } from '../../../../common/translators/translator';
import { messenger } from '../../../services/messenger';
import { Icon } from '../../../common/components/ui/Icon';
import { rootStore } from '../../stores/RootStore';
import { TelemetryEventName, TelemetryScreenName } from '../../../../background/services';

import './footer.pcss';

export const Footer = observer(() => {
    const { settingsStore, telemetryStore } = useContext(rootStore);

    const hideRate = () => {
        settingsStore.hideFooterRateShow();
    };

    const handleRateClick = async () => {
        telemetryStore.sendCustomEvent(
            TelemetryEventName.RateUsClick,
            TelemetryScreenName.MainPage,
        );

        await messenger.openExtensionStore();
        settingsStore.hideFooterRateShow();
    };

    return (
        <footer className="footer">
            {settingsStore.footerRateShowState && (
                <div role="alert" className="footer__rate">
                    <div className="footer__in footer__in--rate container">
                        <div className="footer__rate-desc">
                            {translator.getMessage('options_do_you_like_question')}
                        </div>
                        <button
                            type="button"
                            className="button button--green-bg button--s"
                            onClick={handleRateClick}
                        >
                            {translator.getMessage('options_footer_like_us_cta')}
                        </button>
                        <button
                            type="button"
                            className="footer__rate-close"
                            onClick={hideRate}
                            aria-label={translator.getMessage('close_button_title')}
                        >
                            <Icon
                                id="#cross"
                                className="icon--24 icon--gray-default"
                                aria-hidden="true"
                            />
                        </button>
                    </div>
                </div>
            )}
        </footer>
    );
});
