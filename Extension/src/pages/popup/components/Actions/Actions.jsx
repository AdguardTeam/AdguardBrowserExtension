import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import cn from 'classnames';

import { messenger } from '../../../services/messenger';
import { popupStore } from '../../stores/PopupStore';
import { reactTranslator } from '../../../../common/translators/reactTranslator';
import { Icon } from '../../../common/components/ui/Icon';

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
        if (!store.applicationAvailable) {
            return;
        }
        messenger.openAbuseSite(store.url, 'popup');
        window.close();
    };

    const handleCheckSiteSecurity = () => {
        if (!store.applicationAvailable) {
            return;
        }
        messenger.checkSiteSecurity(store.url);
        window.close();
    };

    const resetCustomRulesForPage = async () => {
        if (!store.applicationAvailable) {
            return;
        }

        await messenger.resetCustomRulesForPage(store.url);
        window.close();
    };

    const actionChangingClassname = cn('action', { action_disabled: !store.applicationAvailable });

    return (
        <div className="actions">
            <button
                type="button"
                className={actionChangingClassname}
                onClick={handleBlockAds}
            >
                <Icon
                    id="#block-ad"
                    classname="icon--action"
                />
                <div className="action-title">
                    {reactTranslator.getMessage('popup_block_site_ads_option')}
                </div>
            </button>
            <button
                type="button"
                className="action"
                onClick={handleOpenFilteringLog}
            >
                <Icon
                    id="#sandwich"
                    classname="icon--action"
                />
                <div className="action-title">
                    {reactTranslator.getMessage('popup_open_filtering_log')}
                </div>
            </button>
            <button
                type="button"
                className={actionChangingClassname}
                onClick={handleAbuseSite}
            >
                <Icon
                    id="#thumb-down"
                    classname="icon--action"
                />
                <div className="action-title">
                    {reactTranslator.getMessage('popup_abuse_site')}
                </div>
            </button>
            <button
                type="button"
                className={actionChangingClassname}
                onClick={handleCheckSiteSecurity}
            >
                <Icon
                    id="#shield"
                    classname="icon--action"
                />
                <div className="action-title">
                    {reactTranslator.getMessage('popup_security_report')}
                </div>
            </button>
            { store.hasCustomRulesToReset
            && (
                <button
                    type="button"
                    className={actionChangingClassname}
                    onClick={resetCustomRulesForPage}
                >
                    <Icon
                        id="#small-cross"
                        classname="icon--action"
                    />
                    <div
                        className="action-title"
                        title={reactTranslator.getMessage('popup_reset_custom_rules')}
                    >
                        {reactTranslator.getMessage('popup_reset_custom_rules')}
                    </div>
                </button>
            )}
        </div>
    );
});
