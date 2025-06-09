/**
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

import './about-page.pcss';

const About = observer(() => {
    const { settingsStore } = useContext(rootStore);

    const { version, libVersions } = settingsStore;

    if (!version) {
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
                    {`${translator.getMessage('options_about_version')} ${version}`}
                    <p>
                        {`TSWebExtension v${libVersions.tswebextension}`}
                        <br />
                        {`TSUrlFilter v${libVersions.tsurlfilter}`}
                        <br />
                        {`Scriptlets v${libVersions.scriptlets}`}
                        <br />
                        {`ExtendedCss v${libVersions.extendedCss}`}
                        {/* // TODO revert later AG-42086 */}
                        {/* {libVersions.dnrRulesets && ( */}
                        {/*     <> */}
                        {/*         <br /> */}
                        {/*         {`DNR-Rulesets v${libVersions.dnrRulesets}`} */}
                        {/*     </> */}
                        {/* )} */}
                    </p>
                </div>
                <ul
                    className="about__libs"
                    aria-label={translator.getMessage('options_about_libs')}
                >
                    <li className="about__version">
                        {`TSWebExtension v${libVersions.tswebextension}`}
                    </li>
                    <li className="about__version">
                        {`TSUrlFilter v${libVersions.tsurlfilter}`}
                    </li>
                    <li className="about__version">
                        {`Scriptlets v${libVersions.scriptlets}`}
                    </li>
                    <li className="about__version">
                        {`ExtendedCss v${libVersions.extendedCss}`}
                    </li>
                    {libVersions.dnrRulesets && (
                        <li className="about__version">
                            {`DNR-Rulesets v${libVersions.dnrRulesets}`}
                        </li>
                    )}
                </ul>
                <div className="about__copyright">
                    {copyRightText}
                    {/* Hide following br tag so Screen Reader will read text together */}
                    <br aria-hidden="true" />
                    {translator.getMessage('options_copyright')}
                </div>
                <div className="links-menu">
                    <a
                        target="_blank"
                        rel="noopener noreferrer"
                        href={CHANGELOG_URL}
                        className="links-menu__item button--link--green"
                    >
                        {translator.getMessage('options_open_changelog')}
                    </a>
                    <a
                        target="_blank"
                        rel="noopener noreferrer"
                        href={PRIVACY_URL}
                        className="links-menu__item button--link--green"
                    >
                        {translator.getMessage('options_privacy_policy')}
                    </a>
                    <a
                        target="_blank"
                        rel="noopener noreferrer"
                        href={WEBSITE_URL}
                        className="links-menu__item button--link--green"
                    >
                        {translator.getMessage('options_site')}
                    </a>
                    <a
                        target="_blank"
                        rel="noopener noreferrer"
                        href={DISCUSS_URL}
                        className="links-menu__item button--link--green"
                    >
                        {translator.getMessage('options_discuss')}
                    </a>
                    <a
                        target="_blank"
                        rel="noopener noreferrer"
                        href={ACKNOWLEDGMENTS_URL}
                        className="links-menu__item button--link--green"
                    >
                        {translator.getMessage('options_acknowledgment')}
                    </a>
                    <a
                        target="_blank"
                        rel="noopener noreferrer"
                        href={GITHUB_URL}
                        className="links-menu__item button--link--green"
                    >
                        {translator.getMessage('options_github')}
                    </a>
                </div>
            </div>
        </>
    );
});

export { About };
