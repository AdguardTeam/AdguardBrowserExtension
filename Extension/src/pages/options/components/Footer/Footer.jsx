import React from 'react';

import { FORUM_URL, WEBSITE_URL } from '../../../constants';
import { reactTranslator } from '../../../../common/translators/reactTranslator';
import { messenger } from '../../../services/messenger';

import './footer.pcss';

const Footer = () => {
    const currentYear = new Date().getFullYear();
    const copyright = `© Adguard, 2009-${currentYear}`;
    return (
        <div className="footer">
            <div className="footer__rate">
                <div className="footer__in footer__in--rate container">
                    <div className="footer__rate-desc">
                        {reactTranslator.getMessage('options_do_you_like_question')}
                    </div>
                    <button
                        type="button"
                        className="button button--green button--s"
                        onClick={messenger.openExtensionStore}
                    >
                        {reactTranslator.getMessage('options_footer_like_us_cta')}
                    </button>
                </div>
            </div>
            <div className="footer__nav">
                <div className="footer__in container">
                    <div className="footer__copyright">{copyright}</div>
                    <div className="footer__nav-in">
                        <a href={WEBSITE_URL} className="footer__nav-item">
                            {reactTranslator.getMessage('options_site')}
                        </a>
                        <a href={FORUM_URL} className="footer__nav-item">
                            {reactTranslator.getMessage('options_discuss')}
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export { Footer };
