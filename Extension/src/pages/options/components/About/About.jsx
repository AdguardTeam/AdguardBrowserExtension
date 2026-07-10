/**
 * Copyright (c) 2015-2026 Adguard Software Ltd.
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

import cn from 'classnames';

import { useTelemetryPageViewEvent } from '../../../common/telemetry';
import { TelemetryScreenName } from '../../../../common/telemetry';
import { rootStore } from '../../stores/RootStore';
import {
    CHANGELOG_URL,
    ACKNOWLEDGMENTS_URL,
    GITHUB_URL,
    PRIVACY_URL,
    WEBSITE_URL,
    DISCUSS_URL,
} from '../../constants';
import { translator } from '../../../../common/translators/translator';

import { AboutLink } from './AboutLink';

import './about-page.pcss';

const About = observer(() => {
    const { settingsStore, telemetryStore } = useContext(rootStore);

    useTelemetryPageViewEvent(telemetryStore, TelemetryScreenName.AboutScreen);

    const {
        appVersion,
        libVersions,
        availableUpdateVersion,
    } = settingsStore;

    if (!appVersion) {
        return null;
    }

    const currentYear = new Date().getFullYear();
    const copyRightText = `© 2009-${currentYear} Adguard Software Ltd.`;

    return (
        <>
            <div className="title__container title__container--about">
                <h2 className="title">
                    {translator.getMessage('options_about')}
                </h2>
            </div>
            <div className="about">
                <div className="about__title">
                    {translator.getMessage('options_about_title')}
                </div>
                <div className="about__version">
                    <p
                        className={cn('about__current-version', {
                            'about__current-version--with-update': availableUpdateVersion,
                        })}
                    >
                        {`${translator.getMessage('options_about_version')} ${appVersion}`}
                    </p>
                    {availableUpdateVersion && (
                        <p className="about__update-available">
                            {translator.getMessage('options_about_update_available', {
                                version: availableUpdateVersion,
                            })}
                        </p>
                    )}
                    <ul className="about__libs">
                        <li>{`TSWebExtension v${libVersions.tswebextension}`}</li>
                        <li>{`TSUrlFilter v${libVersions.tsurlfilter}`}</li>
                        <li>{`Scriptlets v${libVersions.scriptlets}`}</li>
                        <li>{`ExtendedCss v${libVersions.extendedCss}`}</li>
                        {libVersions.dnrRulesets && (
                            <li>{`DNR rulesets v${libVersions.dnrRulesets}`}</li>
                        )}
                    </ul>
                </div>
                <div className="about__copyright">
                    <span>{copyRightText}</span>
                    <span className="about__copyright-reserved">
                        {translator.getMessage('options_copyright')}
                    </span>
                </div>
                <div className="links-menu">
                    <AboutLink href={CHANGELOG_URL} title={translator.getMessage('options_open_changelog')} />
                    <AboutLink href={PRIVACY_URL} title={translator.getMessage('options_privacy_policy')} />
                    <AboutLink href={WEBSITE_URL} title={translator.getMessage('options_site')} />
                    <AboutLink href={DISCUSS_URL} title={translator.getMessage('options_discuss')} />
                    <AboutLink href={ACKNOWLEDGMENTS_URL} title={translator.getMessage('options_acknowledgment')} />
                    <AboutLink href={GITHUB_URL} title={translator.getMessage('options_github')} />
                </div>
            </div>
        </>
    );
});

export { About };
