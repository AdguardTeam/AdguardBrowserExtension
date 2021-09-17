import React, { useEffect, useState } from 'react';
import beautify from 'js-beautify';

import { RequestTypes } from '../../../../../background/utils/request-types';

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
    text,
    requestType,
    shouldBeautify,
}) => {
    const [textState, setTextState] = useState(text);

    useEffect(() => {
        if (shouldBeautify) {
            const beautifier = getBeautifier(requestType);
            const beautifiedResponse = beautifier(text);
            setTextState(beautifiedResponse);
        }
    }, [shouldBeautify, requestType, text]);

    if (textState) {
        return (
            <div className="request-modal__text">
                <pre>
                    <code>
                        {textState}
                    </code>
                </pre>
            </div>
        );
    }

    return null;
};
