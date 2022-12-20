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
