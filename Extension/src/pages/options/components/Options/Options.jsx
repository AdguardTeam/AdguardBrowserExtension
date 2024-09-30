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
    createHashRouter,
    createRoutesFromElements,
    Outlet,
    Route,
    RouterProvider,
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
import { RulesLimits } from '../RulesLimits';
import { rootStore } from '../../stores/RootStore';
import { Notifications } from '../Notifications';
import { Mv3Notifications } from '../Mv3Notifications';
import { updateFilterDescription } from '../../../helpers';
import { messenger } from '../../../services/messenger';
import { logger } from '../../../../common/logger';
import { Icons as CommonIcons } from '../../../common/components/ui/Icons';
import { Loader } from '../../../common/components/Loader';
import { NotifierType } from '../../../../common/constants';
import { useAppearanceTheme } from '../../../common/hooks/useAppearanceTheme';
import { OptionsPageSections } from '../../../../common/nav';
import { translator } from '../../../../common/translators/translator';
import { Icons } from '../ui/Icons';

import '../../styles/styles.pcss';

const createRouter = (children) => {
    return createHashRouter(createRoutesFromElements(children));
};

const OptionsLayout = () => {
    return (
        <>
            <Sidebar />
            <div className="inner">
                <div className="content">
                    <Notifications />
                    <Mv3Notifications />
                    <Outlet />
                </div>
                <Footer />
            </div>
        </>
    );
};

const Options = observer(() => {
    const { settingsStore, uiStore } = useContext(rootStore);

    useAppearanceTheme(settingsStore.appearanceTheme);

    useEffect(() => {
        let removeListenerCallback = () => {};

        const subscribeToMessages = async () => {
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
                            settingsStore.setFullscreenUserRulesEditorState(isOpen);
                            break;
                        }
                        default: {
                            logger.debug('Undefined message type:', type);
                            break;
                        }
                    }
                },
            );
        };

        (async () => {
            const { areFilterLimitsExceeded } = await settingsStore.requestOptionsData(true);

            // Show notification about changed filter list by browser only once.
            if (__IS_MV3__ && areFilterLimitsExceeded) {
                uiStore.addMv3Notification({
                    description: translator.getMessage('popup_limits_exceeded_warning'),
                    extra: {
                        link: translator.getMessage('options_rule_limits'),
                    },
                });
            }

            // Note: Is it important to check the limits after the request for
            // options data is completed, because the request for options data
            // will wait until the background service worker wakes up.
            if (__IS_MV3__) {
                await settingsStore.checkLimitations();
            }

            await subscribeToMessages();
        })();

        return () => {
            removeListenerCallback();
        };
    }, [settingsStore, uiStore]);

    if (!settingsStore.optionsReadyToRender) {
        return null;
    }

    return (
        <>
            <CommonIcons />
            <Icons />
            <Loader showLoader={uiStore.showLoader} />
            <div className="page">
                <RouterProvider
                    router={(
                        createRouter(
                            <Route path="/" element={<OptionsLayout />}>
                                <Route index element={<General />} />
                                <Route path={OptionsPageSections.filters} element={<Filters />} />
                                <Route path={OptionsPageSections.stealth} element={<Stealth />} />
                                <Route path={OptionsPageSections.allowlist} element={<Allowlist />} />
                                <Route path={OptionsPageSections.userFilter} element={<UserRules />} />
                                <Route path={OptionsPageSections.miscellaneous} element={<Miscellaneous />} />
                                {__IS_MV3__ && (
                                    <Route path={OptionsPageSections.ruleLimits} element={<RulesLimits />} />
                                )}
                                <Route path={OptionsPageSections.about} element={<About />} />
                                <Route path="*" element={<General />} />
                            </Route>,
                        )
                    )}
                />
            </div>
        </>
    );
});

export { Options };
