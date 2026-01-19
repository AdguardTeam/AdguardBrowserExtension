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
    useState,
    useEffect,
    useRef,
} from 'react';

import { AttachmentPortal } from '../../AttachmentPortal';
import { Tooltip } from '../Tooltip';
import { type Position } from '../../types';

import styles from './popover.module.pcss';

/**
 * Default delay before showing popover.
 */
const POPOVER_SHOW_DELAY_MS = 500;

type TooltipState = {
    visible: boolean;
    position: Position | null;
};

type PopoverParams = {
    /**
     * Popover text.
     */
    text?: string | React.ReactNode;

    /**
     * Delay before showing popover.
     */
    delay?: number;

    /**
     * Flag to show "Coming soon" text and use 'help' cursor.
     */
    comingSoon?: boolean;

    /**
     * Child node.
     */
    children: React.ReactNode;
};

/**
 * Wrap child container for handle tooltips rendering in overlay on hover
 */
export const Popover = ({
    text,
    delay,
    comingSoon,
    children,
    ...props
}: PopoverParams) => {
    const defaultTooltip: TooltipState = {
        visible: false,
        position: null,
    };

    const [tooltip, setTooltip] = useState(defaultTooltip);

    const timer = useRef<ReturnType<typeof setTimeout> | undefined>();

    // clear timer on unmounting
    useEffect(() => {
        return () => {
            clearTimeout(timer.current);
        };
    }, []);

    const handleMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
        const { left, bottom } = e.currentTarget.getBoundingClientRect();

        timer.current = setTimeout(() => {
            setTooltip({
                visible: true,
                position: {
                    x: left + window.scrollX,
                    y: bottom + window.scrollY,
                },
            });
        }, delay || POPOVER_SHOW_DELAY_MS);
    };

    const handleMouseLeave = () => {
        clearTimeout(timer.current);
        setTooltip({
            visible: false,
            position: null,
        });
    };

    const popoverClassName = comingSoon
        ? styles.popoverComingSoon
        : styles.popoverDefault;

    return (
        <div
            className={popoverClassName}
            {...props}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {tooltip.visible && tooltip.position && (
                <AttachmentPortal rootId="root-portal" position={tooltip.position}>
                    <Tooltip text={text} visible={tooltip.visible} fixedWidth />
                </AttachmentPortal>
            )}
            {children}
        </div>
    );
};
