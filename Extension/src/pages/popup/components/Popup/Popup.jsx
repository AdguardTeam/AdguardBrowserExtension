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

import React, {
    useContext,
    useEffect,
    useLayoutEffect,
} from 'react';
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
import { useObservePopupHeight } from '../../hooks/useObservePopupHeight';

import '../../styles/main.pcss';
import './popup.pcss';

export const Popup = observer(() => {
    const {
        appearanceTheme,
        getPopupData,
        updateBlockedStats,
        isAndroidBrowser,
    } = useContext(popupStore);

    useAppearanceTheme(appearanceTheme);

    // retrieve init data
    useEffect(() => {
        (async () => {
            await getPopupData();
        })();
    }, [getPopupData]);

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
    const handleResize = (newPopupHeight) => {
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
        <>
            <Icons />
            <Header />
            <MainContainer />
            <Tabs />
            <Footer />
            <PromoNotification />
        </>
    );
});
