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

import { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { AntibannerGroupsId } from '../../../../common/constants';
import { logger } from '../../../../common/logger';
import { getFiltersGroupPath } from '../../../../common/nav';
import { TelemetryEventName } from '../../../../common/telemetry';
import { translator } from '../../../../common/translators/translator';
import { AUTO_DISABLE_NOTIFICATION_DEDUPE_KEY } from '../../../common/constants';
import { NotificationType } from '../../../common/types';
import { messenger } from '../../../services/messenger';
import { rootStore } from '../../stores/RootStore';

import { getAutoDisableNotificationMessage } from './message';

/**
 * Shows pending automatic disables once per options-page lifetime and
 * acknowledges them after the notification is added.
 *
 * Telemetry events of the notification are not tied to a specific screen,
 * because the notification can appear on any options page section.
 *
 * @returns Nothing to render.
 */
export const AutoDisableNotification = () => {
    const { uiStore, telemetryStore } = useContext(rootStore);
    const navigate = useNavigate();

    useEffect(() => {
        let active = true;
        const load = async (): Promise<void> => {
            try {
                const filters = await messenger.getAutoDisableNotifications();
                const text = getAutoDisableNotificationMessage(filters);
                if (!active || text === null) {
                    return;
                }
                const notificationId = uiStore.addNotification({
                    type: NotificationType.Warning,
                    text,
                    dedupeKey: AUTO_DISABLE_NOTIFICATION_DEDUPE_KEY,
                    closeManually: true,
                    buttons: [{
                        title: translator.getMessage('options_auto_disabled_filters_review'),
                        onClick: () => {
                            telemetryStore.sendCustomEvent(TelemetryEventName.UnusedFilterReviewClick, undefined);
                            navigate(`/${getFiltersGroupPath(AntibannerGroupsId.LanguageFiltersGroupId)}`);
                        },
                    }],
                    onClose: () => {
                        telemetryStore.sendCustomEvent(TelemetryEventName.UnusedFilterCloseClick, undefined);
                    },
                });
                if (notificationId === null) {
                    return;
                }
                telemetryStore.sendCustomEvent(TelemetryEventName.UnusedFilterNotificationDisplayed, undefined);
                await messenger.acknowledgeAutoDisableNotifications(filters.map(({ filterId }) => filterId));
            } catch (error) {
                logger.error('[ext.AutoDisableNotification-mv2]: failed to show notification:', error);
            }
        };
        load();
        return () => {
            active = false;
        };
    }, [uiStore, telemetryStore, navigate]);

    return null;
};
