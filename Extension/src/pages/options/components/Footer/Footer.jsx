import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { reactTranslator } from '../../../../common/translators/reactTranslator';
import { messenger } from '../../../services/messenger';
import { Icon } from '../../../common/components/ui/Icon';
import { rootStore } from '../../stores/RootStore';

import './footer.pcss';

export const Footer = observer(() => {
    const { settingsStore } = useContext(rootStore);

    const hideRate = () => {
        settingsStore.hideFooterRateShow();
    };

    const handleRateClick = async () => {
        await messenger.openExtensionStore();
        settingsStore.hideFooterRateShow();
    };

    return (
        <div className="footer">
            {settingsStore.footerRateShowState && (
                <div className="footer__rate">
                    <div className="footer__in footer__in--rate container">
                        <div className="footer__rate-desc">
                            {reactTranslator.getMessage('options_do_you_like_question')}
                        </div>
                        <button
                            type="button"
                            className="button button--green button--s"
                            onClick={handleRateClick}
                        >
                            {reactTranslator.getMessage('options_footer_like_us_cta')}
                        </button>
                        <button
                            type="button"
                            className="footer__rate-close"
                            onClick={hideRate}
                            aria-label={reactTranslator.getMessage('close_button_title')}
                        >
                            <Icon id="#cross" classname="icon--cross" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
});
