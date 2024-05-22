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

import React, {
    useState,
    useEffect,
    useRef,
} from 'react';

import { AttachmentPortal } from '../../AttachmentPortal';
import { Tooltip } from '../Tooltip';
import { Position } from '../../types';

const TOOLTIP_SHOW_DELAY_MS = 1000;

type TooltipState = {
    visible: boolean;
    position: Position | null;
};

type PopoverParams = {
    /**
     * Tooltip text.
     */
    text?: string;

    /**
     * Delay before showing tooltip.
     */
    delay?: number;

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

        if (!timer.current) {
            return;
        }

        timer.current = setTimeout(() => {
            setTooltip({
                visible: true,
                position: {
                    x: left + window.scrollX,
                    y: bottom + window.scrollY,
                },
            });
        }, delay || TOOLTIP_SHOW_DELAY_MS);
    };

    const handleMouseLeave = () => {
        clearTimeout(timer.current);
        setTooltip({
            visible: false,
            position: null,
        });
    };

    return (
        <div
            className="popover"
            {...props}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {tooltip.visible && tooltip.position && (
                <AttachmentPortal rootId="root-portal" position={tooltip.position}>
                    <Tooltip text={text} />
                </AttachmentPortal>
            )}
            {children}
        </div>
    );
};
