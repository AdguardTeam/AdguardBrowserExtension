import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import cs from 'classnames';

import translator from '../../../../common/translator/translator';
import { messenger } from '../../../services/messenger';
import { popupStore } from '../../stores/PopupStore';

import './actions.pcss';

export const Actions = observer(() => {
    const store = useContext(popupStore);

    const handleBlockAds = () => {
        if (!store.applicationAvailable) {
            return;
        }
        messenger.openAssistant();
        window.close();
    };

    const handleOpenFilteringLog = () => {
        messenger.openFilteringLog();
        window.close();
    };

    const handleAbuseSite = () => {
        messenger.openAbuseSite(store.url);
        window.close();
    };

    const handleCheckSiteSecurity = () => {
        messenger.checkSiteSecurity(store.url);
        window.close();
    };

    const actionChangingClassname = cs('action', { action_disabled: !store.applicationAvailable });

    return (
        <div className="actions">
            <div
                className={actionChangingClassname}
                onClick={handleBlockAds}
            >
                <svg className="icon icon--action">
                    <use xlinkHref="#block-ad" />
                </svg>
                <div className="action-title">
                    {translator.translate('popup_block_site_ads')}
                </div>
            </div>
            <div
                className="action"
                onClick={handleOpenFilteringLog}
            >
                <svg className="icon icon--action">
                    <use xlinkHref="#sandwich" />
                </svg>
                <div className="action-title">
                    {translator.translate('popup_open_filtering_log')}
                </div>
            </div>
            <div
                className={actionChangingClassname}
                onClick={handleAbuseSite}
            >
                <svg className="icon icon--action">
                    <use xlinkHref="#thumb-down" />
                </svg>
                <div className="action-title">
                    {translator.translate('popup_abuse_site')}
                </div>
            </div>
            <div
                className={actionChangingClassname}
                onClick={handleCheckSiteSecurity}
            >
                <svg className="icon icon--action">
                    <use xlinkHref="#shield" />
                </svg>
                <div className="action-title">
                    {translator.translate('popup_security_report')}
                </div>
            </div>
        </div>
    );
});
