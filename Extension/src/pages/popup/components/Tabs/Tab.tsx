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

import React, {
    forwardRef,
    useImperativeHandle,
    useRef,
} from 'react';

import cn from 'classnames';

export enum TabKey {
    Left = 'ArrowLeft',
    Right = 'ArrowRight',
    Home = 'Home',
    End = 'End',
}

type TabParams = {
    /**
     * Tab id.
     */
    id: string;

    /**
     * Tab title.
     */
    title: string;

    /**
     * Whether the tab is active.
     */
    active: boolean;

    /**
     * Panel id.
     */
    panelId: string;

    /**
     * Click handler.
     */
    onClick: () => void;

    /**
     * Keyboard navigation handler.
     *
     * @param key - Pressed key.
     */
    onKeyNavigate: (key: TabKey) => void;
};

export const Tab = forwardRef<HTMLButtonElement, TabParams>((props, forwardedRef) => {
    const {
        id,
        title,
        active,
        panelId,
        onClick,
        onKeyNavigate,
    } = props;

    const ref = useRef<HTMLButtonElement>(null);
    const tabClass = cn('tabs__tab', { 'tabs__tab--active': active });

    const focus = () => {
        if (ref.current) {
            ref.current.focus();
        }
    };

    const handleClick = () => {
        onClick();
        focus();
    };

    const handleFocus = () => {
        onClick();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (Object.values(TabKey).includes(e.key as TabKey)) {
            e.preventDefault();
            e.stopPropagation();
            onKeyNavigate(e.key as TabKey);
        }
    };

    useImperativeHandle(forwardedRef, () => ref.current!);

    return (
        <button
            ref={ref}
            id={id}
            role="tab"
            type="button"
            className={tabClass}
            title={title}
            aria-selected={active}
            aria-controls={panelId}
            tabIndex={active ? undefined : -1}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
        >
            {title}
        </button>
    );
});
