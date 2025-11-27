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
import { Route, RouterProvider } from 'react-router-dom';
import { observer } from 'mobx-react';

import { General } from '../General';
import { Filters } from '../Filters';
import { Stealth } from '../Stealth';
import { Allowlist } from '../Allowlist';
import { UserRules } from '../UserRules';
import { Miscellaneous } from '../Miscellaneous';
import { About } from '../About';
import { rootStore } from '../../stores/RootStore';
import { updateFilterDescription } from '../../../helpers';
import { messenger } from '../../../services/messenger';
import { logger } from '../../../../common/logger';
import { Icons as CommonIcons } from '../../../common/components/ui/Icons';
import { Loader } from '../../../common/components/Loader';
import { NotifierType } from '../../../../common/constants';
import { useAppearanceTheme } from '../../../common/hooks/useAppearanceTheme';
import { OptionsPageSections } from '../../../../common/nav';
import { Icons } from '../ui/Icons';

import { createRouter, OptionsLayout } from './Options-common';

import '../../styles/styles.pcss';

const Options = observer(() => {
    const { settingsStore, uiStore } = useContext(rootStore);

    useAppearanceTheme(settingsStore.appearanceTheme);

    useEffect(() => {
        let removeListenerCallback = () => { };

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
                            logger.warn('[ext.Options-mv2]: Undefined message type:', type);
                            break;
                        }
                    }
                },
            );
        };

        (async () => {
            const optionsData = await settingsStore.requestOptionsData();

            if (!optionsData) {
                logger.error('[ext.Options-mv2]: Failed to get options data');

                return;
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
                    // We are opting out these features and hiding the warning messages by setting it to false.
                    // TODO: Remove this when react-router-dom is updated to v7
                    // https://github.com/remix-run/react-router/issues/12250
                    future={{
                        // @ts-expect-error v7_relativeSplatPath can be used here, but types are not updated yet
                        v7_relativeSplatPath: false,
                        v7_startTransition: false,
                    }}
                    router={(
                        createRouter(
                            <Route path="/" element={<OptionsLayout />}>
                                <Route index element={<General />} />
                                <Route path={OptionsPageSections.filters} element={<Filters />} />
                                <Route path={OptionsPageSections.stealth} element={<Stealth />} />
                                <Route path={OptionsPageSections.allowlist} element={<Allowlist />} />
                                <Route path={OptionsPageSections.userFilter} element={<UserRules />} />
                                <Route path={OptionsPageSections.miscellaneous} element={<Miscellaneous />} />
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
