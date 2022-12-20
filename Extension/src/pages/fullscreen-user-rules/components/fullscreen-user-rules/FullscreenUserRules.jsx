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

import { UserRulesEditor } from '../../../common/components/UserRulesEditor';
import { FULLSCREEN_USER_RULES_EDITOR, NotifierType } from '../../../../common/constants';
import { messenger } from '../../../services/messenger';
import { Log } from '../../../../common/log';
import { fullscreenUserRulesStore } from '../../stores/FullscreenUserRulesStore';
import { useAppearanceTheme } from '../../../common/hooks/useAppearanceTheme';
import { Icons } from '../../../common/components/ui/Icons';

import '../../../options/styles/styles.pcss';
import '../../../options/components/UserRules/styles.pcss';

export const FullscreenUserRules = observer(() => {
    const store = useContext(fullscreenUserRulesStore);

    useAppearanceTheme(store.appearanceTheme);

    // append message listeners
    useEffect(() => {
        store.getFullscreenUserRulesData();

        let removeListenerCallback = async () => {};

        (async () => {
            const events = [
                NotifierType.SettingUpdated,
            ];

            removeListenerCallback = messenger.createLongLivedConnection(
                FULLSCREEN_USER_RULES_EDITOR,
                events,
                async (message) => {
                    const { type } = message;

                    switch (type) {
                        case NotifierType.SettingUpdated: {
                            await store.getFullscreenUserRulesData();
                            break;
                        }
                        default: {
                            Log.debug('There is no listener for type:', type);
                            break;
                        }
                    }
                },
            );
        })();

        return () => {
            removeListenerCallback();
        };
    }, [store]);

    return (
        <>
            <Icons />
            <UserRulesEditor fullscreen />
        </>
    );
});
