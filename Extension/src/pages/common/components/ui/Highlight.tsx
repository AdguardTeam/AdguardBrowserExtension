/**
 * Copyright (c) 2015-2026 Adguard Software Ltd.
 *
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

import React from 'react';

import { findChunks } from '../../../helpers';

/**
 * Props for the {@link Highlight} component.
 */
interface HighlightProps {
    /**
     * The text to highlight within.
     */
    text: string;

    /**
     * The search term to highlight. If empty, the text is rendered as-is.
     */
    term: string;

    /**
     * Optional CSS class applied to matching chunks.
     */
    highlightClassName?: string;
}

/**
 * Stateless presentational component that splits `text` by `term` and wraps
 * matching substrings in a `<span>` with an optional `highlightClassName`.
 *
 * @param props Component props.
 *
 * @returns React element with highlighted text.
 */
export const Highlight = ({ text, term, highlightClassName }: HighlightProps) => {
    if (!term) {
        // eslint-disable-next-line react/jsx-no-useless-fragment
        return <>{text}</>;
    }

    const chunks = findChunks(text, term);
    if (chunks.length === 0) {
        // eslint-disable-next-line react/jsx-no-useless-fragment
        return <>{text}</>;
    }

    const lowerTerm = term.toLowerCase();

    return (
        <>
            {chunks.map((chunk, index) => {
                const isMatch = chunk.toLowerCase() === lowerTerm;

                /* eslint-disable react/no-array-index-key */
                return (
                    <span
                        key={index}
                        className={isMatch ? highlightClassName : undefined}
                    >
                        {chunk}
                    </span>
                );
            })}
        </>
    );
};
