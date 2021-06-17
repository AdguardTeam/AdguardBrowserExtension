import React, { useEffect, useState } from 'react';
import beautify from 'js-beautify';

import { RequestTypes } from '../../../../../background/utils/request-types';
import { log } from '../../../../../common/log';

const getBeautifier = (type) => {
    switch (type) {
        case RequestTypes.DOCUMENT:
        case RequestTypes.SUBDOCUMENT:
            return beautify.html;
        case RequestTypes.SCRIPT:
            return beautify.js;
        case RequestTypes.STYLESHEET:
            return beautify.css;
        default:
            return (i) => i;
    }
};

export const TextRequest = ({
    url,
    requestType,
    shouldBeautify,
    onError,
    onSuccess,
}) => {
    const [response, setResponse] = useState(null);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(url);
                const text = await res.text();
                onSuccess();
                setResponse(text);
            } catch (e) {
                onError();
                log.error(e);
            }
        })();
    }, []);

    useEffect(() => {
        if (shouldBeautify) {
            const beautifier = getBeautifier(requestType);
            const beautifiedResponse = beautifier(response);
            setResponse(beautifiedResponse);
        }
    }, [shouldBeautify]);

    if (response) {
        return (
            <div className="request-modal__text">
                <pre>
                    <code>
                        {response}
                    </code>
                </pre>
            </div>
        );
    }

    return null;
};
