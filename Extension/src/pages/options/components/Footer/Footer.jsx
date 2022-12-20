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

import { reactTranslator } from '../../../../common/translators/reactTranslator';
import { messenger } from '../../../services/messenger';
import { Icon } from '../../../common/components/ui/Icon';
import { rootStore } from '../../stores/RootStore';

import './footer.pcss';

export const Footer = observer(() => {
    const { settingsStore } = useContext(rootStore);

    const hideRate = () => {
        settingsStore.hideFooterRateShow();
    };

    const handleRateClick = async () => {
        await messenger.openExtensionStore();
        settingsStore.hideFooterRateShow();
    };

    return (
        <div className="footer">
            {settingsStore.footerRateShowState && (
                <div className="footer__rate">
                    <div className="footer__in footer__in--rate container">
                        <div className="footer__rate-desc">
                            {reactTranslator.getMessage('options_do_you_like_question')}
                        </div>
                        <button
                            type="button"
                            className="button button--green button--s"
                            onClick={handleRateClick}
                        >
                            {reactTranslator.getMessage('options_footer_like_us_cta')}
                        </button>
                        <button
                            type="button"
                            className="footer__rate-close"
                            onClick={hideRate}
                            aria-label={reactTranslator.getMessage('close_button_title')}
                        >
                            <Icon id="#cross" classname="icon--cross" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
});
