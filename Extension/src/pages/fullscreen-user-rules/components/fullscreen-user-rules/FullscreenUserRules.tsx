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

import React, { useContext, useEffect } from 'react';
import { observer } from 'mobx-react';

import { Loader } from '../../../common/components/Loader';
import { UserRulesEditor } from '../../../common/components/UserRulesEditor';
import { Notifications } from '../../../options/components/Notifications';
import { NotifierType } from '../../../../common/constants';
import { rootStore } from '../../../options/stores/RootStore';
import {
    Messenger,
    type LongLivedConnectionCallbackMessage,
    Page,
} from '../../../services/messenger';
import { logger } from '../../../../common/logger';
import { fullscreenUserRulesStore } from '../../stores/FullscreenUserRulesStore';
import { useAppearanceTheme } from '../../../common/hooks/useAppearanceTheme';
import { Icons } from '../../../common/components/ui/Icons';

import '../../../options/styles/styles.pcss';
import '../../../options/components/UserRules/styles.pcss';

export const FullscreenUserRules = observer(() => {
    const store = useContext(fullscreenUserRulesStore);

    const { uiStore: { showLoader } } = useContext(rootStore);

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

    return (
        <>
            <Loader showLoader={showLoader} />
            <Icons />
            <Notifications />
            <UserRulesEditor fullscreen />
        </>
    );
});
