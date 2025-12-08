/**
 * Copyright (c) 2015-2025 Adguard Software Ltd.
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

import React, { forwardRef } from 'react';

import cn from 'classnames';

import { useTextCollapse } from '../../hooks/useTextCollapse';
import { translator } from '../../../../common/translators/translator';
import { CopyToClipboard } from '../CopyToClipboard';

import './text-collapser.pcss';

type TextCollapserProps = {
    text: string;
    width: number;
    lineCountLimit: number;
    collapserButtonMessages: {
        showMessage?: string;
        hideMessage?: string;
    };
    canCopy?: boolean;
    children?: React.ReactNode;
};

export const TextCollapser = forwardRef((
    {
        text,
        width,
        lineCountLimit,
        collapserButtonMessages,
        canCopy,
        children,
    }: TextCollapserProps,
    ref: React.Ref<HTMLElement>,
) => {
    const [
        isCollapsed,
        isOverflown,
        toggleCollapsed,
    ] = useTextCollapse(text, width, lineCountLimit, true);

    const handleClick = () => {
        toggleCollapsed();
    };

    const handleKeyUp = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            toggleCollapsed();
        }
    };

    const DEFAULT_SHOW_MESSAGE = translator.getMessage('text_collapser_show_default');
    const DEFAULT_HIDE_MESSAGE = translator.getMessage('text_collapser_hide_default');

    // Pick required collapser button text
    const {
        showMessage = DEFAULT_SHOW_MESSAGE,
        hideMessage = DEFAULT_HIDE_MESSAGE,
    } = collapserButtonMessages;

    const collapserButtonText = isCollapsed
        ? showMessage
        : hideMessage;

    // Pick required text style
    const hasCollapsedStyle = isCollapsed && isOverflown;

    const collapserClassName = hasCollapsedStyle
        ? 'text-collapser__text-short'
        : 'text-collapser__text-full';

    const collapsedProps = hasCollapsedStyle && {
        style: { WebkitLineClamp: lineCountLimit },
    };

    return (
        <>
            {canCopy ? (
                <CopyToClipboard
                    ref={ref}
                    wrapperClassName="text-collapser__copy-to-clipboard-wrapper"
                    className={cn(
                        'text-collapser__copy-to-clipboard',
                        collapserClassName,
                    )}
                    {...collapsedProps}
                >
                    {text}
                </CopyToClipboard>
            ) : (
                <div
                    className={collapserClassName}
                    {...collapsedProps}
                >
                    {text}
                </div>
            )}

            <div className="request-modal__text-actions">
                {isOverflown && (
                    <div
                        role="button"
                        className="button button--link--green request-modal__url-button"
                        tabIndex={0}
                        onClick={handleClick}
                        onKeyUp={handleKeyUp}
                    >
                        {collapserButtonText}
                    </div>
                )}
                {children}
            </div>
        </>
    );
});
