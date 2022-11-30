import React, { useEffect, useState } from 'react';
import beautify from 'js-beautify';

import { RequestType } from '../../../../../common/constants';

const getBeautifier = (type) => {
    switch (type) {
        case RequestType.Document:
        case RequestType.Subdocument:
            return beautify.html;
        case RequestType.Script:
            return beautify.js;
        case RequestType.Stylesheet:
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
