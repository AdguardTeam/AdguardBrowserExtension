import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import './about-page.pcss';
import { rootStore } from '../../stores/RootStore';
import {
    ACKNOWLEDGMENTS_URL,
    EULA_URL,
    GITHUB_URL,
    PRIVACY_URL,
} from '../../../constants';

const About = observer(() => {
    const { settingsStore } = useContext(rootStore);

    const { version } = settingsStore;

    if (!version) {
        return null;
    }

    const currentYear = new Date().getFullYear();
    const copyRightText = `© 2009-${currentYear} AdGuard Software Ltd.`;

    // TODO add translations to every string
    return (
        <>
            <h2 className="title">About</h2>
            <div className="about">
                <div className="logo about__logo" />
                <div className="about__version">
                    Version
                    {' '}
                    {version}
                </div>
                <div className="about__copyright">
                    <div className="about__copyright-item">
                        {copyRightText}
                    </div>
                    <div className="about__copyright-item">
                        All rights reserved.
                    </div>
                </div>
                <div className="about__menu">
                    <a
                        target="_blank"
                        rel="noopener noreferrer"
                        href={EULA_URL}
                        className="about__menu-item"
                    >
                        End-User License Agreement
                    </a>
                    <a
                        target="_blank"
                        rel="noopener noreferrer"
                        href={PRIVACY_URL}
                        className="about__menu-item"
                    >
                        Privacy Policy
                    </a>
                    <a
                        target="_blank"
                        rel="noopener noreferrer"
                        href={ACKNOWLEDGMENTS_URL}
                        className="about__menu-item"
                    >
                        Acknowledgments
                    </a>
                    <a
                        target="_blank"
                        rel="noopener noreferrer"
                        href={GITHUB_URL}
                        className="about__menu-item"
                    >
                        Github
                    </a>
                </div>
            </div>
        </>
    );
});

export { About };
