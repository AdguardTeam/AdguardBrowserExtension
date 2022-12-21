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
import {
    HashRouter,
    Route,
    Switch,
} from 'react-router-dom';
import { observer } from 'mobx-react';

import { General } from '../General';
import { Sidebar } from '../Sidebar';
import { Filters } from '../Filters';
import { Stealth } from '../Stealth';
import { Allowlist } from '../Allowlist';
import { UserRules } from '../UserRules';
import { Miscellaneous } from '../Miscellaneous';
import { About } from '../About';
import { Footer } from '../Footer';
import { rootStore } from '../../stores/RootStore';
import { Notifications } from '../Notifications';
import { updateFilterDescription } from '../../../helpers';
import { messenger } from '../../../services/messenger';
import { Log } from '../../../../common/log';
import { Icons } from '../../../common/components/ui/Icons';
import { NotifierType } from '../../../../common/constants';
import { useAppearanceTheme } from '../../../common/hooks/useAppearanceTheme';

import '../../styles/styles.pcss';

const Options = observer(() => {
    const { settingsStore, uiStore } = useContext(rootStore);

    useAppearanceTheme(settingsStore.appearanceTheme);

    useEffect(() => {
        let removeListenerCallback = () => {};

        (async () => {
            await settingsStore.requestOptionsData(true);

            const events = [
                NotifierType.RequestFilterUpdated,
                NotifierType.UpdateAllowlistFilterRules,
                NotifierType.FiltersUpdateCheckReady,
                NotifierType.SettingUpdated,
                NotifierType.FullscreenUserRulesEditorUpdated,
            ];

            removeListenerCallback = await messenger.createEventListener(
                events,
                async (message) => {
                    const { type } = message;

                    switch (type) {
                        case NotifierType.RequestFilterUpdated: {
                            await settingsStore.requestOptionsData();
                            break;
                        }
                        case NotifierType.UpdateAllowlistFilterRules: {
                            await settingsStore.getAllowlist();
                            break;
                        }
                        case NotifierType.FiltersUpdateCheckReady: {
                            const [updatedFilters] = message.data;
                            settingsStore.refreshFilters(updatedFilters);
                            uiStore.addNotification(updateFilterDescription(updatedFilters));
                            break;
                        }
                        case NotifierType.SettingUpdated: {
                            await settingsStore.requestOptionsData();
                            break;
                        }
                        case NotifierType.FullscreenUserRulesEditorUpdated: {
                            const [isOpen] = message.data;
                            await settingsStore.setFullscreenUserRulesEditorState(isOpen);
                            break;
                        }
                        default: {
                            Log.debug('Undefined message type:', type);
                            break;
                        }
                    }
                },
            );
        })();

        return () => {
            removeListenerCallback();
        };
    }, [settingsStore, uiStore]);

    if (!settingsStore.optionsReadyToRender) {
        return null;
    }

    return (
        <HashRouter hashType="noslash">
            <Icons />
            <div className="page">
                <Sidebar />
                <div className="inner">
                    <div className="content">
                        <Notifications />
                        <Switch>
                            <Route path="/" exact component={General} />
                            <Route path="/filters" component={Filters} />
                            <Route path="/stealth" component={Stealth} />
                            <Route path="/allowlist" component={Allowlist} />
                            <Route path="/user-filter" component={UserRules} />
                            <Route path="/miscellaneous" component={Miscellaneous} />
                            <Route path="/about" component={About} />
                            <Route component={General} />
                        </Switch>
                    </div>
                    <Footer />
                </div>
            </div>
        </HashRouter>
    );
});

export { Options };
