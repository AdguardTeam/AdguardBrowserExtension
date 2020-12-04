import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { reactTranslator } from '../../../reactCommon/reactTranslator';
import { popupStore } from '../../stores/PopupStore';
import { Icon } from '../ui/Icon';

import './footer.pcss';

export const Footer = observer(() => {
    const store = useContext(popupStore);

    const LINK_TO_IOS = 'https://adguard.com/forward.html?action=ios_about&from=popup&app=browser_extension';
    const LINK_TO_ANDROID = 'https://adguard.com/forward.html?action=android_about&from=popup&app=browser_extension';

    let footerContent = (
        <>
            <div className="footer__text">{reactTranslator.translate('popup_adguard_footer_title')}</div>
            <div className="footer__platforms">
                <a
                    href={LINK_TO_IOS}
                    target="_blank"
                    rel="noreferrer"
                    className="footer__link"
                >
                    <Icon
                        id="#apple"
                        className="footer__icon"
                    />
                </a>
                <a
                    href={LINK_TO_ANDROID}
                    target="_blank"
                    rel="noreferrer"
                    className="footer__link"
                >
                    <Icon
                        id="#android"
                        className="footer__icon"
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
