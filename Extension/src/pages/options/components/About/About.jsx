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
} from '../../../constants';
import { reactTranslator } from '../../../../common/translators/reactTranslator';

import './about-page.pcss';

const About = observer(() => {
    const { settingsStore } = useContext(rootStore);

    const { version } = settingsStore;

    if (!version) {
        return null;
    }

    const currentYear = new Date().getFullYear();
    const copyRightText = `© 2009-${currentYear} AdGuard Software Ltd.`;

    return (
        <>
            <div className="title__container">
                <h2 className="title">
                    {reactTranslator.getMessage('options_about')}
                </h2>
            </div>
            <div className="about">
                <div className="about__title">
                    {reactTranslator.getMessage('options_about_title')}
                </div>
                <div className="about__version">
                    {reactTranslator.getMessage('options_about_version')}
                    {' '}
                    {version}
                </div>
                <div className="about__copyright">
                    <div className="about__copyright-item">
                        {copyRightText}
                    </div>
                    <div className="about__copyright-item">
                        {reactTranslator.getMessage('options_copyright')}
                    </div>
                </div>
                <div className="about__menu">
                    <a
                        target="_blank"
                        rel="noopener noreferrer"
                        href={CHANGELOG_URL}
                        className="about__menu-item"
                    >
                        {reactTranslator.getMessage('options_open_changelog')}
                    </a>
                    <a
                        target="_blank"
                        rel="noopener noreferrer"
                        href={PRIVACY_URL}
                        className="about__menu-item"
                    >
                        {reactTranslator.getMessage('options_privacy_policy')}
                    </a>
                    <a
                        target="_blank"
                        rel="noopener noreferrer"
                        href={WEBSITE_URL}
                        className="about__menu-item"
                    >
                        {reactTranslator.getMessage('options_site')}
                    </a>
                    <a
                        target="_blank"
                        rel="noopener noreferrer"
                        href={DISCUSS_URL}
                        className="about__menu-item"
                    >
                        {reactTranslator.getMessage('options_discuss')}
                    </a>
                    <a
                        target="_blank"
                        rel="noopener noreferrer"
                        href={ACKNOWLEDGMENTS_URL}
                        className="about__menu-item"
                    >
                        {reactTranslator.getMessage('options_acknowledgment')}
                    </a>
                    <a
                        target="_blank"
                        rel="noopener noreferrer"
                        href={GITHUB_URL}
                        className="about__menu-item"
                    >
                        {reactTranslator.getMessage('options_github')}
                    </a>
                </div>
            </div>
        </>
    );
});

export { About };
