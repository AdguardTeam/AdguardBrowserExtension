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

import cn from 'classnames';

import { popupStore } from '../../../stores/PopupStore';
import { isTransitionAppState } from '../../../state-machines/app-state-machine';
import { translator } from '../../../../../common/translators/translator';
import { Icon } from '../../../../common/components/ui/Icon';
import { logger } from '../../../../../common/logger';

/**
 * Main switcher component props.
 */
type MainSwitchProps = {
    /**
     * Whether the switcher is enabled.
     */
    isEnabled?: boolean;

    /**
     * Click handler for the switcher.
     */
    clickHandler?: () => void;
};

export const MainSwitch = observer(({ isEnabled, clickHandler }: MainSwitchProps) => {
    if (typeof isEnabled === 'undefined') {
        logger.error('isEnabled should be defined for the main switcher');
        return null;
    }

    const { appState } = useContext(popupStore);

    const isTransition = isTransitionAppState(appState);

    // click handler is not needed during the transition
    // but in other cases it is required
    if (!isTransition && !clickHandler) {
        logger.error('No click handler defined for the main switcher');
        return null;
    }

    return (
        <button
            type="button"
            className={cn('switcher', {
                'non-active': isTransition,
            })}
            onClick={clickHandler}
            title={translator.getMessage('popup_switch_button')}
        >
            <div
                className={cn('switcher__track', {
                    'switcher__track--disabled': !isEnabled,
                })}
            />
            <div
                className={cn('switcher__handle', {
                    'switcher__handle--disabled': !isEnabled,
                })}
            >
                {/* enabled switcher state */}
                <Icon
                    id="#checkmark"
                    classname="icon--24 switcher__icon switcher__icon--on"
                />
                {/* disabled switcher state */}
                <Icon
                    id="#circle"
                    classname="icon--24 switcher__icon switcher__icon--off"
                />
            </div>
        </button>
    );
});
