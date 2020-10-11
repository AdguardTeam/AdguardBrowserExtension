import React from 'react';
import './footer.pcss';
import { FORUM_URL, GITHUB_URL, WEBSITE_URL } from '../../../constants';
import i18n from '../../../services/i18n';

const Footer = () => {
    const currentYear = new Date().getFullYear();
    const copyright = `&copy; Adguard, 2009-${currentYear}`;
    return (
        <div className="footer">
            <div className="footer__rate">
                <div className="footer__in container">
                    <div className="footer__rate-desc">
                        {i18n.translate('options_do_you_like')}
                    </div>
                    <button type="button" className="button button--rate">
                        {i18n.translate('options_footer_like_us')}
                    </button>
                </div>
            </div>
            <div className="footer__nav">
                <div className="footer__in container">
                    <div className="footer__copyright">
                        <div className="footer__logo" />
                        <div className="footer__copyright-label">
                            {copyright}
                        </div>
                    </div>
                    <div className="footer__nav-in">
                        <a href={WEBSITE_URL} className="footer__nav-item">
                            {i18n.translate('options_site')}
                        </a>
                        <a href={FORUM_URL} className="footer__nav-item">
                            {i18n.translate('options_discuss')}
                        </a>
                        <a href={GITHUB_URL} className="footer__nav-item">
                            {i18n.translate('options_github')}
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Footer;
