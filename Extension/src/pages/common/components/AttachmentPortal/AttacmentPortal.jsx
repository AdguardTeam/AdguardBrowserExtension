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

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const TOOLTIP_EDGE_PADDING = 4; // px

const getCssString = (position, visible) => {
    const { x, y } = position;
    let css = `z-index:999;position:absolute;top:${y}px;left:${x}px;`;
    if (!visible) {
        css += 'visibility:hidden;';
    }
    return css;
};

export const AttachmentPortal = ({ rootId, position, children }) => {
    const parent = document.getElementById(rootId);
    const ref = useRef(document.createElement('div'));

    useEffect(() => {
        const el = ref.current;
        el.setAttribute('style', getCssString(position, false));
        parent.appendChild(el);
        const rect = el.getBoundingClientRect();

        const offsetEdge = {
            top: rect.y,
            right: window.innerWidth - rect.right,
            bottom: window.innerHeight - rect.bottom,
            left: rect.x,
        };

        const nextPosition = { ...position };

        if (offsetEdge.right < TOOLTIP_EDGE_PADDING) {
            nextPosition.x = rect.x + offsetEdge.right - TOOLTIP_EDGE_PADDING;
        }

        if (offsetEdge.left < TOOLTIP_EDGE_PADDING) {
            nextPosition.x = rect.x - offsetEdge.left + TOOLTIP_EDGE_PADDING;
        }

        if (offsetEdge.top < TOOLTIP_EDGE_PADDING) {
            nextPosition.y = rect.y - offsetEdge.top + TOOLTIP_EDGE_PADDING;
        }

        if (offsetEdge.bottom < TOOLTIP_EDGE_PADDING) {
            nextPosition.y = rect.y + offsetEdge.bottom - TOOLTIP_EDGE_PADDING;
        }

        el.setAttribute('style', getCssString(nextPosition, true));

        return () => {
            parent.removeChild(el);
        };
    }, [ref, parent, position]);

    return createPortal(children, ref.current);
};
