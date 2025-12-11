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

import { translator } from '../../../../../common/translators/translator';
import { messenger } from '../../../../services/messenger';
import { Icon } from '../../../../common/components/ui/Icon';
import { popupStore } from '../../../stores/PopupStore';
import { TelemetryEventName, TelemetryScreenName } from '../../../../../background/services/telemetry/enums';

import { type SingleActionParams } from './types';

import '../actions.pcss';

export const OpenFilteringLogAction = observer(({ className }: SingleActionParams) => {
    const store = useContext(popupStore);
    const { telemetryStore } = store;
    const title = translator.getMessage('popup_open_filtering_log');

    /**
     * Handle open filtering log action click.
     */
    const handleOpenFilteringLog = () => {
        telemetryStore.sendCustomEvent(
            TelemetryEventName.OpenLogClick,
            TelemetryScreenName.MainPage,
        );
        messenger.openFilteringLog();
        window.close();
    };

    return (
        <button
            type="button"
            className={className}
            title={title}
            onClick={handleOpenFilteringLog}
        >
            <Icon
                id="#sandwich"
                className="icon--24 icon--action--sandwich"
                aria-hidden="true"
            />
            <span className="action__title">
                {title}
            </span>
        </button>
    );
});
