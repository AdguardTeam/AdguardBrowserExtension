import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { reactTranslator } from '../../../reactCommon/reactTranslator';
import { popupStore } from '../../stores/PopupStore';

import './footer.pcss';

export const Footer = observer(() => {
    const store = useContext(popupStore);

    let footerContent = (
        <>
            <div className="footer__text">{reactTranslator.translate('popup_adguard_footer_title')}</div>
            <div className="footer__platforms">
                <a
                    href="https://adguard.com/forward.html?action=ios_about&from=popup&app=browser_extension"
                    target="_blank"
                    rel="noreferrer"
                >
                    <svg className="icon icon--button">
                        <use xlinkHref="#apple" />
                    </svg>
                </a>
                <a
                    href="https://adguard.com/forward.html?action=android_about&from=popup&app=browser_extension"
                    target="_blank"
                    rel="noreferrer"
                >
                    <svg className="icon icon--button">
                        <use xlinkHref="#android" />
                    </svg>
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
