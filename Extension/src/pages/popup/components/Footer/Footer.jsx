import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { reactTranslator } from '../../../../common/translators/reactTranslator';
import { popupStore } from '../../stores/PopupStore';
import { Icon } from '../../../common/components/ui/Icon';

import './footer.pcss';

export const Footer = observer(() => {
    const store = useContext(popupStore);

    const LINK_TO_IOS = 'https://link.adtidy.org/forward.html?action=ios_about&from=popup&app=browser_extension';
    const LINK_TO_ANDROID = 'https://link.adtidy.org/forward.html?action=android_about&from=popup&app=browser_extension';

    let footerContent = (
        <>
            <div className="footer__text">{reactTranslator.getMessage('popup_adguard_footer_title')}</div>
            <div className="footer__platforms">
                <a
                    href={LINK_TO_IOS}
                    target="_blank"
                    rel="noreferrer"
                    className="footer__link"
                    title={reactTranslator.getMessage('popup_adguard_for_ios')}
                >
                    <Icon
                        id="#apple"
                        classname="footer__icon"
                    />
                </a>
                <a
                    href={LINK_TO_ANDROID}
                    target="_blank"
                    rel="noreferrer"
                    className="footer__link"
                    title={reactTranslator.getMessage('popup_adguard_for_android')}
                >
                    <Icon
                        id="#android"
                        classname="footer__icon"
                    />
                </a>
            </div>
        </>
    );

    if (store.isEdgeBrowser) {
        const currentYear = new Date().getFullYear();
        const footerText = `© 2009-${currentYear} AdGuard Software Ltd`;
        footerContent = <div className="footer__text">{footerText}</div>;
    }

    return (
        <div className="footer">{footerContent}</div>
    );
});
