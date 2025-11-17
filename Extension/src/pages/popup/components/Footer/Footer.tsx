/**
 * Copyright (c) 2015-2025 Adguard Software Ltd.
 *
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

import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { translator } from '../../../../common/translators/translator';
import { Icon } from '../../../common/components/ui/Icon';
import { IOS_URL, ANDROID_URL } from '../../constants';
import { popupStore } from '../../stores/PopupStore';

import './footer.pcss';

export const Footer = observer(() => {
    const store = useContext(popupStore);

    let footerContent = (
        <>
            <div
                className="footer__text"
                title={translator.getMessage('popup_adguard_footer_title')}
            >
                {translator.getMessage('popup_adguard_footer_title')}
            </div>
            <div className="footer__platforms">
                <a
                    href={IOS_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="footer__link"
                    title={translator.getMessage('popup_adguard_for_ios')}
                >
                    <Icon
                        id="#apple"
                        className="icon--24 icon--footer"
                        aria-hidden="true"
                    />
                </a>
                <a
                    href={ANDROID_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="footer__link"
                    title={translator.getMessage('popup_adguard_for_android')}
                >
                    <Icon
                        id="#android"
                        className="icon--24 icon--footer"
                        aria-hidden="true"
                    />
                </a>
            </div>
        </>
    );

    if (store.isEdgeBrowser) {
        const currentYear = new Date().getFullYear();
        const footerText = `© 2009-${currentYear} Adguard Software Ltd`;
        footerContent = <div className="footer__text">{footerText}</div>;
    }

    return (
        <div className="footer">{footerContent}</div>
    );
});
