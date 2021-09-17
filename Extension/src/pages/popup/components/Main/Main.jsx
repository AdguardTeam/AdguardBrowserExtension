import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { reactTranslator } from '../../../../common/translators/reactTranslator';
import { popupStore } from '../../stores/PopupStore';
import { POPUP_STATES } from '../../constants';
import { Icon } from '../../../common/components/ui/Icon';

import './main.pcss';

export const Main = observer(() => {
    const store = useContext(popupStore);

    const switchersMap = {
        [POPUP_STATES.APPLICATION_ENABLED]: {
            handler: () => {
                store.toggleAllowlisted();
            },
            mode: 'enabled',
        },
        [POPUP_STATES.APPLICATION_FILTERING_DISABLED]: {
            handler: () => {
                store.changeApplicationFilteringDisabled(false);
            },
            mode: 'disabled',
        },
        [POPUP_STATES.APPLICATION_UNAVAILABLE]: {
            mode: 'unavailable',
        },
        [POPUP_STATES.SITE_IN_EXCEPTION]: {
            mode: 'in-exception',
        },
        [POPUP_STATES.SITE_ALLOWLISTED]: {
            handler: () => {
                store.toggleAllowlisted();
            },
            mode: 'allowlisted',
        },
    };

    const switcher = switchersMap[store.popupState];

    return (
        <div className={`main main--${switcher.mode}`}>
            {store.isInitialDataReceived && (
                <>
                    <div className="main__header">
                        {store.showInfoAboutFullVersion && (
                            <div className="main__cta-link">
                                <a
                                    href="https://adguard.com/forward.html?action=compare&from=popup&app=browser_extension"
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    {reactTranslator.getMessage('popup_header_cta_link')}
                                </a>
                            </div>
                        )}
                        <div className="main__stats">
                            <div className="main__total-blocked-tab">
                                {reactTranslator.getMessage('popup_tab_blocked_count', {
                                    num: store.totalBlockedTab.toLocaleString(),
                                })}
                            </div>
                            <div className="main__total-blocked-all">
                                {reactTranslator.getMessage('popup_tab_blocked_all_count', {
                                    num: store.totalBlocked.toLocaleString(),
                                })}
                            </div>
                        </div>
                    </div>
                    <button
                        type="button"
                        className="switcher"
                        onClick={switcher.handler}
                        title={reactTranslator.getMessage('popup_switch_button')}
                    >
                        <div className={`switcher__center switcher__center--${switcher.mode}`} />
                        <div className="switcher__btn">
                            <Icon id="#checkmark" classname="icon--checkmark switcher__icon switcher__icon--checkmark" width="66" height="66" />
                            <Icon id="#circle" classname="icon--circle switcher__icon switcher__icon--circle" />
                            <Icon id="#play" classname="icon--play switcher__icon switcher__icon--play" />
                            <Icon id="#exclamation" classname="icon--exclamation switcher__icon switcher__icon--exclamation" />
                        </div>
                    </button>
                    <div className="switcher__info">
                        <div className="current-site">
                            {store.currentSite}
                        </div>
                        <div className="current-status">
                            {store.currentStatusMessage}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
});
