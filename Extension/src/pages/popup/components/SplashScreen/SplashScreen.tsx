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

import React from 'react';

import { translator } from '../../../../common/translators/translator';
import { Icon } from '../../../common/components/ui/Icon';

import './splash-screen.pcss';

type SplashScreenProps = {
    /**
     * Flag that indicates whether the engine is started.
     */
    isEngineStarted: boolean | null;
};

export const SplashScreen = ({ isEngineStarted }: SplashScreenProps) => {
    // logo on the splash screen should be shown only if the engine is definitely not started
    // and the flag isEngineStarted is set (default value is null when the engine state is not yet determined)
    const shouldShowLogo = isEngineStarted !== null && !isEngineStarted;

    return (
        <div className="splash-screen">
            {shouldShowLogo && (
                <Icon
                    id="#logo-splash"
                    classname="splash-screen__logo"
                    title={translator.getMessage('popup_site_filtering_state_loading')}
                />
            )}
        </div>
    );
};
