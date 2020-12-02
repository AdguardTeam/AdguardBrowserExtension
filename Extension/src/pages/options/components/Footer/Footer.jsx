import React from 'react';

import { FORUM_URL, WEBSITE_URL } from '../../../constants';
import { reactTranslator } from '../../../reactCommon/reactTranslator';
import { messenger } from '../../../services/messenger';

import './footer.pcss';

const Footer = () => {
    const currentYear = new Date().getFullYear();
    const copyright = `© Adguard, 2009-${currentYear}`;
    return (
        <div className="footer">
            <div className="footer__rate">
                <div className="footer__in container">
                    <div className="footer__rate-desc">
                        {reactTranslator.translate('options_do_you_like')}
                    </div>
                    <button
                        type="button"
                        className="button button--rate"
                        onClick={messenger.openExtensionStore}
                    >
                        <img id="thumbsup" className="button__img" src="../../../assets/images/thumbsup.svg" alt="" />
                        <label
                            htmlFor="thumbsup"
                            className="button__label button__label--rate"
                        >
                            {reactTranslator.translate('options_footer_like_us')}
                        </label>
                    </button>
                </div>
            </div>
            <div className="footer__nav">
                <div className="footer__in container">
                    <div className="footer__copyright">{copyright}</div>
                    <div className="footer__nav-in">
                        <a href={WEBSITE_URL} className="footer__nav-item">
                            {reactTranslator.translate('options_site')}
                        </a>
                        <a href={FORUM_URL} className="footer__nav-item">
                            {reactTranslator.translate('options_discuss')}
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export { Footer };
