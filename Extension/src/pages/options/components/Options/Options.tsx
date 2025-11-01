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
    useRef,
} from 'react';
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
import { updateFilterDescription } from '../../../helpers';
import { messenger } from '../../../services/messenger';
import { logger } from '../../../../common/logger';
import { Icons as CommonIcons } from '../../../common/components/ui/Icons';
import { Loader } from '../../../common/components/Loader';
import { ExtensionUpdateFSMState, NotifierType } from '../../../../common/constants';
import { useAppearanceTheme } from '../../../common/hooks/useAppearanceTheme';
import { NotificationType } from '../../../common/types';
import { OptionsPageSections } from '../../../../common/nav';
import { translator } from '../../../../common/translators/translator';
import { Icons } from '../ui/Icons';
import { SkipToContentButton } from '../SkipToContentButton';

import '../../styles/styles.pcss';

const createRouter = (children: React.ReactNode) => {
    return createHashRouter(
        createRoutesFromElements(children),
        // We are opting out these features and hiding the warning messages by setting it to false.
        // TODO: Remove this when react-router-dom is updated to v7
        // https://github.com/remix-run/react-router/issues/12250
        {
            future: {
                v7_relativeSplatPath: false,
                v7_fetcherPersist: false,
                v7_normalizeFormMethod: false,
                v7_partialHydration: false,
                v7_skipActionErrorRevalidation: false,
            },
        },
    );
};

const OptionsLayout = observer(() => {
    const mainRef = useRef(null);
    const { uiStore } = useContext(rootStore);

    return (
        <>
            <SkipToContentButton mainRef={mainRef} />
            <Sidebar />
            <div className="inner">
                <main
                    ref={mainRef}
                    className="content"
                    inert={uiStore.isSidebarOpen ? '' : undefined}
                >
                    <Notifications />
                    <Outlet />
                </main>
                <Footer />
            </div>
        </>
    );
});

const Options = observer(() => {
    const { settingsStore, uiStore } = useContext(rootStore);

    useAppearanceTheme(settingsStore.appearanceTheme);

    useEffect(() => {
        let removeListenerCallback = () => { };

        const handleExtensionUpdateStateChange = (state: ExtensionUpdateFSMState) => {
            switch (state) {
                case ExtensionUpdateFSMState.Checking:
                    settingsStore.setIsExtensionCheckingUpdateOrUpdating(true);
                    break;
                case ExtensionUpdateFSMState.NotAvailable: {
                    settingsStore.setIsExtensionCheckingUpdateOrUpdating(false);
                    uiStore.addNotification({
                        type: NotificationType.Success,
                        text: translator.getMessage('update_not_needed'),
                    });
                    break;
                }
                case ExtensionUpdateFSMState.Available: {
                    settingsStore.setIsExtensionCheckingUpdateOrUpdating(false);
                    settingsStore.setIsExtensionUpdateAvailable(true);
                    break;
                }
                case ExtensionUpdateFSMState.Updating:
                    settingsStore.setIsExtensionCheckingUpdateOrUpdating(true);
                    break;
                case ExtensionUpdateFSMState.Failed: {
                    settingsStore.setIsExtensionCheckingUpdateOrUpdating(false);
                    settingsStore.setIsExtensionUpdateAvailable(false);
                    uiStore.addNotification({
                        type: NotificationType.Error,
                        text: translator.getMessage('update_failed_text'),
                        button: {
                            title: translator.getMessage('update_failed_try_again_btn'),
                            onClick: settingsStore.checkUpdatesMV3,
                        },
                    });
                    break;
                }
                default: {
                    // do nothing since notification should be shown
                    // for a limited list of states
                    break;
                }
            }
        };

        const subscribeToMessages = async () => {
            const events = [
                NotifierType.RequestFilterUpdated,
                NotifierType.UpdateAllowlistFilterRules,
                NotifierType.FiltersUpdateCheckReady,
                NotifierType.SettingUpdated,
                NotifierType.FullscreenUserRulesEditorUpdated,
                NotifierType.ExtensionUpdateStateChange,
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
                        case NotifierType.ExtensionUpdateStateChange: {
                            const [eventData] = message.data;
                            handleExtensionUpdateStateChange(eventData);
                            break;
                        }
                        default: {
                            logger.warn('[ext.Options]: Undefined message type:', type);
                            break;
                        }
                    }
                },
            );
        };

        (async () => {
            const optionsData = await settingsStore.requestOptionsData();

            if (!optionsData) {
                logger.error('[ext.Options]: Failed to get options data');

                return;
            }

            const { mv3SpecificOptions } = optionsData;

            // Show notification about changed filter list by browser only once.
            if (__IS_MV3__ && mv3SpecificOptions?.areFilterLimitsExceeded) {
                uiStore.addRuleLimitsNotification(translator.getMessage('popup_limits_exceeded_warning'));
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
