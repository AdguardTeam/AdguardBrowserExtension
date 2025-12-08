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

import classNames from 'classnames';

import { Popover } from '../../../../common/components/ui/Popover';
import { UserAgent } from '../../../../../common/user-agent';

/**
 * List of actions that can be performed with tags using keyboard.
 */
export enum TagKeyAction {
    /**
     * Selects the previous tag.
     */
    Prev = 'prev',

    /**
     * Selects the next tag.
     */
    Next = 'next',
}

interface TagWrapperProps {
    /**
     * Optional tooltip text.
     */
    tooltip?: string;

    /**
     * Children to render.
     */
    children: React.ReactNode;
}

const TagWrapper = ({ tooltip, children }: TagWrapperProps) => {
    if (tooltip) {
        return (
            <Popover text={tooltip}>
                {children}
            </Popover>
        );
    }

    return (
        <div className="tag-wrapper">
            {children}
        </div>
    );
};

export interface TagProps {
    /**
     * Tag color type.
     */
    type: string;

    /**
     * ID of the tag.
     */
    id: string;

    /**
     * Tag title.
     */
    title: string;

    /**
     * Optional tooltip text.
     */
    tooltip?: string;

    /**
     * Is tag checked.
     */
    checked: boolean;

    /**
     * Click event handler.
     *
     * @param tagId ID of the tag.
     * @param isMetaPressed Is meta key pressed (Cmd on Mac, Ctrl on Windows).
     */
    onClick: (tagId: string, isMetaPressed: boolean) => void;

    /**
     * Key down event handler.
     *
     * @param tagId ID of the tag.
     * @param action Action to perform.
     */
    onKeyDown: (tagId: string, action: TagKeyAction) => void;
}

export const Tag = forwardRef<HTMLButtonElement, TagProps>(({
    type,
    id,
    title,
    tooltip,
    checked,
    onClick,
    onKeyDown,
}, ref) => {
    const descriptionId = tooltip ? `tag-description-${id}` : undefined;

    const classes = classNames(
        'tag',
        id && `tag--${id}`,
        type && `tag--${type}`,
        checked && 'active',
    );

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        onClick(id, UserAgent.isMacOs ? e.metaKey : e.ctrlKey);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
        let action: TagKeyAction | undefined;

        switch (e.key) {
            case 'ArrowLeft':
            case 'ArrowUp':
                action = TagKeyAction.Prev;
                break;
            case 'ArrowRight':
            case 'ArrowDown':
                action = TagKeyAction.Next;
                break;
            default:
                break;
        }

        if (action) {
            e.preventDefault();
            e.stopPropagation();
            onKeyDown(id, action);
        }
    };

    return (
        <TagWrapper tooltip={tooltip}>
            <button
                ref={ref}
                role="radio"
                type="button"
                className={classes}
                aria-checked={checked}
                aria-label={title}
                aria-describedby={descriptionId}
                tabIndex={checked ? 0 : -1}
                onClick={handleClick}
                onKeyDown={handleKeyDown}
            >
                {title}
                {tooltip && descriptionId && (
                    <span id={descriptionId} className="sr-only">
                        {tooltip}
                    </span>
                )}
            </button>
        </TagWrapper>
    );
});
