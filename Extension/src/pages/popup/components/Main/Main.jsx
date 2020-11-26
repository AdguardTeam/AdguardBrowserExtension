import React, { useContext } from 'react';

import { observer } from 'mobx-react';
import { reactTranslator } from '../../../reactCommon/reactTranslator';
import { popupStore } from '../../stores/PopupStore';
import { POPUP_STATES } from '../../constants';

import './main.pcss';

export const Main = observer(() => {
    const store = useContext(popupStore);

    const switchersMap = {
        [POPUP_STATES.APPLICATION_ENABLED]: {
            handler: () => {
                store.toggleAllowlisted();
            },
            text: 'enabled',
        },
        [POPUP_STATES.APPLICATION_FILTERING_DISABLED]: {
            text: 'disabled',
            handler: () => {
                store.changeApplicationFilteringDisabled(false);
            },
        },
        [POPUP_STATES.APPLICATION_UNAVAILABLE]: {
            text: 'unavailable',
        },
        [POPUP_STATES.SITE_IN_EXCEPTION]: {
            text: 'in exception',
        },
        [POPUP_STATES.SITE_ALLOWLISTED]: {
            handler: () => {
                store.toggleAllowlisted();
            },
            text: 'allowlisted',
        },
    };

    const switcher = switchersMap[store.popupState];

    return (
        <div className="main">
            <div className="main__header">
                {store.showInfoAboutFullVersion && (
                    <div className="main__cta-link">
                        <a
                            href="https://adguard.com/forward.html?action=compare&from=popup&app=browser_extension"
                            target="_blank"
                            rel="noreferrer"
                        >
                            {reactTranslator.translate('popup_header_cta_link')}
                        </a>
                    </div>
                )}
                <div className="main__stats">
                    <div className="main__total-blocked-tab">
                        {reactTranslator.translate('popup_tab_blocked', {
                            num: store.totalBlockedTab.toLocaleString(),
                        })}
                    </div>
                    <div className="main__total-blocked-all">
                        {reactTranslator.translate('popup_tab_blocked_all', {
                            num: store.totalBlocked.toLocaleString(),
                        })}
                    </div>
                </div>
            </div>
            <button
                type="button"
                className="switcher"
                onClick={switcher.handler}
            >
                {switcher.text}
            </button>
            <div className="current-site">
                {store.currentSite}
            </div>
            <div className="current-status">
                {store.currentStatusMessage}
            </div>
        </div>
    );
});
