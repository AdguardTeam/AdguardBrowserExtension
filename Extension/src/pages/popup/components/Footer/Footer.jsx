import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { IOS_URL, ANDROID_URL } from '../../constants';
import { reactTranslator } from '../../../../common/translators/reactTranslator';
import { popupStore } from '../../stores/PopupStore';
import { Icon } from '../../../common/components/ui/Icon';

import './footer.pcss';

export const Footer = observer(() => {
    const store = useContext(popupStore);

    let footerContent = (
        <>
            <div className="footer__text">{reactTranslator.getMessage('popup_adguard_footer_title')}</div>
            <div className="footer__platforms">
                <a
                    href={IOS_URL}
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
                    href={ANDROID_URL}
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
