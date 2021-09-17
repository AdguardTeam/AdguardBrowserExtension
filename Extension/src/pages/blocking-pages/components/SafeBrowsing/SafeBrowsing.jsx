/* eslint-disable jsx-a11y/control-has-associated-label */
/* eslint-disable jsx-a11y/anchor-has-content */
import React, { useCallback, useState } from 'react';
import { reactTranslator } from '../../../../common/translators/reactTranslator';

import { MESSAGE_TYPES } from '../../../../common/constants';
import { getParams } from '../../getParams';
import { messenger } from '../../../services/messenger';

import '../../styles/index.pcss';

export const SafeBrowsing = () => {
    const [advanced, setAdvanced] = useState(false);

    const { host, url, malware } = getParams();

    const handleGoBack = useCallback((e) => {
        e.preventDefault();
        window.history.back();
    }, []);

    const handleEnableAdvanced = useCallback((e) => {
        e.preventDefault();
        setAdvanced(true);
    }, []);

    const handleProceed = useCallback((e) => {
        e.preventDefault();
        messenger.sendMessage(MESSAGE_TYPES.OPEN_SAFEBROWSING_TRUSTED, { url });
    }, [url]);

    return (
        <div className="alert alert--red" id="app">
            <div className="alert__in">
                <div className="alert__header alert__header--red">
                    <div className="alert__header-title">
                        {reactTranslator.getMessage('blocking_pages_safe_header_title')}
                    </div>
                </div>
                <div className="alert__body">
                    <a href="https://adguard.com" className="alert__logo" />
                    <div className="hero hero--red" />
                    <div className="alert__body-title">
                        {malware === 'true' ? ( // query param is string
                            <p className="malware">
                                {reactTranslator.getMessage('blocking_pages_malware', {
                                    host,
                                })}
                            </p>
                        ) : (
                            <p className="phishing">
                                {reactTranslator.getMessage('blocking_pages_phishing', {
                                    host,
                                })}
                            </p>
                        )}

                    </div>
                    <div className="alert__btns">
                        <button
                            type="button"
                            onClick={handleGoBack}
                            className="button button--green alert__btn"
                        >
                            {reactTranslator.getMessage('blocking_pages_btn_go_back')}
                        </button>
                        {advanced ? (
                            <>
                                <a
                                    href={`https://reports.adguard.com/${host}/report.html`}
                                    className="button button--white alert__btn"
                                >
                                    {reactTranslator.getMessage('blocking_pages_more_info_button')}
                                </a>
                                <button
                                    type="button"
                                    onClick={handleProceed}
                                    className="button button--white alert__btn"
                                >
                                    {reactTranslator.getMessage('blocking_pages_btn_proceed')}
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    type="button"
                                    onClick={handleEnableAdvanced}
                                    className="button button--white alert__btn"
                                >
                                    {reactTranslator.getMessage('blocking_pages_advanced_button')}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
