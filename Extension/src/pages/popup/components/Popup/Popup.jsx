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
import { PromoNotification } from '../PromoNotification';
import { popupStore } from '../../stores/PopupStore';
import { messenger } from '../../../services/messenger';
import { useAppearanceTheme } from '../../../common/hooks/useAppearanceTheme';

import '../../styles/main.pcss';
import './popup.pcss';

export const Popup = observer(() => {
    const {
        appearanceTheme,
        getPopupData,
        updateBlockedStats,
    } = useContext(popupStore);

    useAppearanceTheme(appearanceTheme);

    // retrieve init data
    useEffect(() => {
        (async () => {
            await getPopupData();
        })();
    }, [getPopupData]);

    // subscribe to stats change
    useEffect(() => {
        const messageHandler = (message) => {
            switch (message.type) {
                case 'updateTotalBlocked': {
                    updateBlockedStats(message.data);
                    break;
                }
                case 'appInitialized': {
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

    return (
        <div className="popup">
            <Icons />
            <Header />
            <MainContainer />
            <Tabs />
            <Footer />
            <PromoNotification />
        </div>
    );
});
