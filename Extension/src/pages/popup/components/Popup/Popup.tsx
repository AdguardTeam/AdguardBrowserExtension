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

import React, { useContext, useEffect } from 'react';
import { observer } from 'mobx-react';

import { Tabs } from '../Tabs';
import { Header } from '../Header';
import { Footer } from '../Footer';
import { Icons } from '../ui/Icons';
import { MainContainer } from '../MainContainer';
import { Notification } from '../Notification';
import { PromoNotification } from '../PromoNotification';
import { SplashScreen } from '../SplashScreen';
import { popupStore } from '../../stores/PopupStore';
import { messenger } from '../../../services/messenger';
import { useAppearanceTheme } from '../../../common/hooks/useAppearanceTheme';
import { Icons as CommonIcons } from '../../../common/components/ui/Icons';
import {
    ExtractedMessage,
    messageHasTypeAndDataFields,
    messageHasTypeField,
    MessageType,
} from '../../../../common/messages';
import { logger } from '../../../../common/logger';

import '../../styles/main.pcss';
import './popup.pcss';

export const Popup = observer(() => {
    const {
        appearanceTheme,
        isLoading,
        isEngineStarted,
        checkIsEngineStarted,
        getPopupData,
        areFilterLimitsExceeded,
        updateBlockedStats,
    } = useContext(popupStore);

    useAppearanceTheme(appearanceTheme);

    // retrieve init data
    useEffect(() => {
        (async () => {
            await checkIsEngineStarted();
            await getPopupData();
        })();
    }, [checkIsEngineStarted, getPopupData]);

    // subscribe to stats change
    useEffect(() => {
        const messageHandler = (message: unknown): undefined => {
            if (!messageHasTypeField(message)) {
                logger.warn('Received message in popup handler has no type field: ', message);
                return;
            }

            switch (message.type) {
                case MessageType.UpdateTotalBlocked: {
                    if (!messageHasTypeAndDataFields(message)) {
                        logger.warn('Received message in popup handler has no type or data fields: ', message);
                        return;
                    }
                    const castedMessage = message as ExtractedMessage<MessageType.UpdateTotalBlocked>;
                    updateBlockedStats(castedMessage.data);
                    break;
                }
                case MessageType.AppInitialized: {
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
    }, [updateBlockedStats, getPopupData]);

    const LoadedPopup = (
        <>
            <Header />
            <MainContainer />
            <Tabs />
            <Footer />
            {/* Promo should be rendered in top of other notifications */}
            { areFilterLimitsExceeded && __IS_MV3__ && <Notification />}
            <PromoNotification />
        </>
    );

    const PopupContent = isLoading
        ? <SplashScreen isEngineStarted={isEngineStarted} />
        : LoadedPopup;

    return (
        <div className="popup">
            <CommonIcons />
            <Icons />
            {PopupContent}
        </div>
    );
});
