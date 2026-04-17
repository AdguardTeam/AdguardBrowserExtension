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

import React, {
    useCallback,
    useContext,
    useEffect,
} from 'react';
import { observer } from 'mobx-react';

import { fullscreenUserRulesStore } from 'fullscreen-user-rules-store';

import { Loader } from '../../../common/components/Loader';
import { UserRulesEditor } from '../../../common/components/UserRulesEditor';
import { NotifierType } from '../../../../common/constants';
import {
    Messenger,
    type LongLivedConnectionCallbackMessage,
    Page,
} from '../../../services/messenger';
import { logger } from '../../../../common/logger';
import { useAppearanceTheme } from '../../../common/hooks/useAppearanceTheme';
import { Icons } from '../../../common/components/ui/Icons';
import { FullscreenNotifications } from '../Notifications';

import '../../../options/styles/styles.pcss';
import '../../../options/components/UserRules/styles.pcss';

export const FullscreenUserRules = observer(() => {
    const store = useContext(fullscreenUserRulesStore);

    useAppearanceTheme(store.appearanceTheme);

    // append message listeners
    useEffect(() => {
        store.getFullscreenUserRulesData();

        let removeListenerCallback = () => {};

        (async () => {
            const events = [
                NotifierType.SettingUpdated,
            ];

            const { onUnload } = Messenger.createLongLivedConnection(
                Page.FullscreenUserRules,
                events,
                async (message: LongLivedConnectionCallbackMessage) => {
                    const { type } = message;

                    switch (type) {
                        case NotifierType.SettingUpdated: {
                            await store.getFullscreenUserRulesData();
                            break;
                        }
                        default: {
                            logger.warn('[ext.FullscreenUserRules]: there is no listener for type:', type);
                            break;
                        }
                    }
                },
            );

            removeListenerCallback = onUnload;
        })();

        return () => {
            removeListenerCallback();
        };
    }, [store]);

    const addNotification = useCallback(
        (params) => store.addNotification(params),
        [store],
    );

    const updateSetting = useCallback(
        (settingId, value) => store.updateSetting(settingId, value),
        [store],
    );

    const checkLimitations = useCallback(
        () => store.checkLimitations(),
        [store],
    );

    const sendTelemetryCustomEvent = useCallback(
        (eventName, screenName) => store.sendTelemetryCustomEvent(eventName, screenName),
        [store],
    );

    return (
        <>
            <Loader showLoader={store.showLoader} />
            <Icons />
            <FullscreenNotifications />
            <UserRulesEditor
                fullscreen
                setShowLoader={store.setShowLoader}
                addNotification={addNotification}
                updateSetting={updateSetting}
                checkLimitations={checkLimitations}
                sendTelemetryCustomEvent={sendTelemetryCustomEvent}
            />
        </>
    );
});
