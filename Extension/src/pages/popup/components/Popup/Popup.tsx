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

import React, {
    useContext,
    useEffect,
    useLayoutEffect,
} from 'react';
import { observer } from 'mobx-react';

import { PopupLayout } from 'popup-layout';

import { Icons } from '../ui/Icons';
import { popupStore } from '../../stores/PopupStore';
import {
    messenger,
    Messenger,
    Page,
} from '../../../services/messenger';
import { useAppearanceTheme } from '../../../common/hooks/useAppearanceTheme';
import { Icons as CommonIcons } from '../../../common/components/ui/Icons';
import {
    type ExtractedMessage,
    messageHasTypeAndDataFields,
    messageHasTypeField,
    MessageType,
} from '../../../../common/messages';
import { logger } from '../../../../common/logger';
import { useObservePopupHeight } from '../../hooks/useObservePopupHeight';
import { TelemetryScreenName } from '../../../../background/services/telemetry/enums';
import { useTelemetryPageViewEvent } from '../../../common/telemetry';
import { AnimatedLoader } from '../AnimatedLoader';

import '../../styles/main.pcss';
import './popup.pcss';

export const Popup = observer(() => {
    const {
        appearanceTheme,
        isAppInitialized,
        fetchIsAppInitialized,
        setIsAppInitialized,
        getPopupData,
        updateBlockedStats,
        isAndroidBrowser,
        isFilteringPossible,
        telemetryStore,
        isPopupDataReceived,
    } = useContext(popupStore);

    useAppearanceTheme(appearanceTheme);

    // Send different telemetry screen name based on whether filtering is possible
    const screenName = isFilteringPossible ? TelemetryScreenName.MainPage : TelemetryScreenName.SecurePage;
    useTelemetryPageViewEvent(telemetryStore, screenName);

    // retrieve init data
    useEffect(() => {
        (async () => {
            await fetchIsAppInitialized();
            await getPopupData();
        })();
    }, [fetchIsAppInitialized, getPopupData]);

    /**
     * We are adding "android" class to html element
     * in order to apply android specific styles.
     */
    useLayoutEffect(() => {
        const ANDROID_CLASS = 'android';

        if (isAndroidBrowser) {
            document.documentElement.classList.add(ANDROID_CLASS);
        } else {
            document.documentElement.classList.remove(ANDROID_CLASS);
        }

        return () => {
            document.documentElement.classList.remove(ANDROID_CLASS);
        };
    }, [isAndroidBrowser]);

    /**
     * Popup height CSS var name.
     */
    const POPUP_HEIGHT_PROP = '--popup-height';

    /**
     * Handle popup resize.
     *
     * @param newPopupHeight New height of the popup.
     */
    const handleResize = (newPopupHeight: number) => {
        document.documentElement.style.setProperty(POPUP_HEIGHT_PROP, `${newPopupHeight}px`);
    };

    /**
     * Handle popup resize cleanup.
     */
    const handleResizeCleanUp = () => {
        document.documentElement.style.removeProperty(POPUP_HEIGHT_PROP);
    };

    /**
     * Update popup height on Android browsers based on window height.
     * This is required because Android browser's popup does not support 100vh properly.
     *
     * NOTE: Same cleanup for both Android and non-Android browsers.
     */
    useObservePopupHeight(
        isAndroidBrowser,
        handleResize,
        handleResizeCleanUp,
        handleResizeCleanUp,
    );

    // Set up telemetry page ID from long-lived connection
    useEffect(() => {
        // For popup we only need the portId (e.g. for telemetry) and don't listen
        // for any messages on this long-lived connection, so we pass an empty handler.
        const { portId, onUnload } = Messenger.createLongLivedConnection(
            Page.Popup,
            [],
            () => {},
        );

        telemetryStore.setPageId(portId);

        return () => {
            telemetryStore.setPageId(null);
            onUnload();
        };
    }, [telemetryStore]);

    // subscribe to stats change
    useEffect(() => {
        const messageHandler = (message: unknown): undefined => {
            if (!messageHasTypeField(message)) {
                logger.warn('[ext.Popup]: received message in popup handler has no type field:', message);
                return;
            }

            switch (message.type) {
                case MessageType.UpdateTotalBlocked: {
                    if (!messageHasTypeAndDataFields(message)) {
                        logger.warn('[ext.Popup]: received message in popup handler has no type or data fields:', message);
                        return;
                    }
                    const castedMessage = message as ExtractedMessage<MessageType.UpdateTotalBlocked>;
                    updateBlockedStats(castedMessage.data);
                    break;
                }
                case MessageType.AppInitialized: {
                    setIsAppInitialized(true);
                    getPopupData();
                    break;
                }
                default:
                    break;
            }
        };

        messenger.onMessage.addListener(messageHandler);

        return () => {
            messenger.onMessage.removeListener(messageHandler);
        };
    }, [updateBlockedStats, getPopupData, setIsAppInitialized]);

    return (
        <>
            <CommonIcons />
            <Icons />
            <AnimatedLoader isLoading={!isAppInitialized}>
                {/* We need to wait for popupData to prevent flicker */}
                {/* of ui that depend on it on popup opening. */}
                {/* This check is done here since AnimatedLoader */}
                {/* is not used while popupData is loading */}
                {isPopupDataReceived ? <PopupLayout /> : null}
            </AnimatedLoader>
        </>
    );
});
