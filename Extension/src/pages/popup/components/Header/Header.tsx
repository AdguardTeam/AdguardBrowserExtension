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

import { Icon } from '../../../common/components/ui/Icon';
import { popupStore } from '../../stores/PopupStore';
import { isTransitionAppState } from '../../state-machines/app-state-machine';

import {
    ProtectionSwitch,
    SettingsButton,
    UpdateButton,
} from './Buttons';

import './header.pcss';

export const Header = observer(() => {
    const store = useContext(popupStore);

    const { appState } = store;

    return (
        <div className="popup-header">
            <Icon
                id="#logo"
                classname="icon--logo"
                aria-hidden="true"
            />
            <div
                className={cn('popup-header__buttons', {
                    'popup-header__buttons--non-active': isTransitionAppState(appState),
                })}
            >
                {!__IS_MV3__ && (
                    <UpdateButton />
                )}
                <ProtectionSwitch />
                <SettingsButton />
            </div>
        </div>
    );
});
