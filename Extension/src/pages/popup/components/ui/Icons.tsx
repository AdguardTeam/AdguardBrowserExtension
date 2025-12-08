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

/* eslint-disable max-len */

import React from 'react';

import './icons.pcss';

export const Icons = () => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className="hidden">
            <symbol id="pause" viewBox="0 0 24 24">
                <g fill="none" fillRule="evenodd">
                    <path stroke="currentColor" clipRule="evenodd" d="M9.5 16V8v8ZM14.5 16V8v8Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <circle stroke="currentColor" cx="12" cy="12" r="10" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </g>
            </symbol>

            <symbol id="start" viewBox="0 0 24 24">
                <g fill="none" fillRule="evenodd">
                    <path stroke="currentColor" clipRule="evenodd" d="M19 12 7 20V4l12 8Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </g>
            </symbol>

            <symbol id="settings" viewBox="0 0 24 24">
                <g fill="none" fillRule="evenodd">
                    <path stroke="currentColor" clipRule="evenodd" d="M7.93 18.91c.13 0 .27.04.39.1.42.22.87.4 1.33.55.26.08.47.3.55.56.25.86.5 1.5.65 1.88h2.3c.16-.39.4-1.03.65-1.88a.83.83 0 0 1 .55-.56c.46-.14.9-.33 1.33-.55a.83.83 0 0 1 .79 0c.78.43 1.4.71 1.79.87l1.62-1.62c-.16-.39-.44-1-.86-1.8a.83.83 0 0 1 0-.78c.21-.42.4-.87.54-1.33.08-.26.3-.47.56-.55.86-.25 1.5-.5 1.88-.65v-2.3c-.39-.16-1.03-.4-1.88-.65a.83.83 0 0 1-.56-.55c-.14-.46-.33-.9-.55-1.33a.83.83 0 0 1 0-.79c.43-.78.71-1.4.87-1.79l-1.62-1.62c-.39.16-1 .44-1.8.86a.83.83 0 0 1-.78.01c-.42-.22-.87-.4-1.33-.55a.83.83 0 0 1-.55-.56c-.25-.85-.5-1.5-.65-1.88h-2.3c-.15.38-.4 1.02-.65 1.87a.83.83 0 0 1-.55.57c-.46.14-.9.33-1.33.55a.83.83 0 0 1-.79 0c-.78-.43-1.4-.71-1.79-.87L4.12 5.74c.16.39.44 1 .86 1.8.14.24.14.53 0 .78-.21.42-.4.87-.54 1.33a.83.83 0 0 1-.56.55c-.85.25-1.5.5-1.88.65v2.3c.38.15 1.02.4 1.86.65.28.07.5.3.59.57.14.45.31.88.53 1.3.14.25.14.57 0 .82-.42.77-.7 1.39-.86 1.77l1.62 1.62c.39-.16 1-.44 1.8-.86.11-.07.25-.1.39-.1Z" strokeWidth="1.5" strokeLinejoin="round" />
                    <path stroke="currentColor" clipRule="evenodd" d="M12 9.27a2.73 2.73 0 1 0 0 5.46 2.73 2.73 0 0 0 0-5.46Z" strokeWidth="1.5" strokeLinejoin="round" />
                </g>
            </symbol>

            <symbol id="block-ad" viewBox="0 0 24 24">
                <g fill="none" fillRule="evenodd">
                    <path stroke="currentColor" clipRule="evenodd" d="M3 8c0-.55228.44772-1 1-1h16c.5523 0 1 .44772 1 1v8c0 .5523-.4477 1-1 1H4c-.55228 0-1-.4477-1-1V8Z" strokeWidth="1.5" strokeLinecap="round" />
                    <path stroke="currentColor" d="M4 21 20 3" strokeWidth="1.5" strokeLinecap="round" />
                </g>
            </symbol>

            <symbol id="sandwich" viewBox="0 0 24 24">
                <g fill="none" fillRule="evenodd">
                    <path stroke="currentColor" d="M4 6h16M4 10h12M4 14h16M4 18h8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </g>
            </symbol>

            <symbol id="thumb-down" viewBox="0 0 24 24">
                <g fill="none" fillRule="evenodd">
                    <path stroke="currentColor" clipRule="evenodd" d="M16.48 11.24c.06.5.06 1.02-.13 1.46-.25.7-.06 4.38.07 5.27.06.26.25.64.43.96l.18.36c.27.56.46 1.17-.36 1.48-2.88 1.02-3.45-1.53-3.82-3.75-.2-.76-.13-1.02-.44-1.27l-.35.31c-1.02.91-2.31 1.98-3.66 1.98-1.44 0-1.82-.96-1.88-1.53-1-.25-1.56-1.52-1.31-2.47-.75-.51-.94-1.53-.63-2.36-.31-.44-.94-1.65-.31-2.6.5-.7 7.51-4.51 8.33-4.83.06-.44.37-.82.75-1.08l1.63-.95c.75-.45 1.69-.2 2.06.57l3.07 5.27a1.7 1.7 0 0 1-.56 2.16l-1.7.96c-.43.25-.93.25-1.37.06Z" strokeWidth="1.5" strokeLinejoin="round" />
                    <path stroke="currentColor" d="m12.5 4.5 3.98 6.74" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </g>
            </symbol>

            <symbol id="info" viewBox="0 0 24 24">
                <g fill="none" fillRule="evenodd">
                    <circle stroke="currentColor" cx="12" cy="12" r="9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path stroke="currentColor" d="M12 16v-6M11.997 7.59552c.012.00193 0-.19106 0-.19106" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </g>
            </symbol>

            <symbol id="small-cross" viewBox="0 0 24 24">
                <g fill="none" fillRule="evenodd">
                    <path stroke="currentColor" d="M6.42857 6.42857 17.6043 17.6043M6.42856 17.5714 17.6043 6.39563" strokeWidth="1.5" strokeLinecap="round" />
                </g>
            </symbol>

            <symbol id="apple" viewBox="0 0 24 24">
                <path fill="currentColor" fillRule="evenodd" clipRule="evenodd" d="M15.25 3.51A4.83 4.83 0 0 0 16.4 0a4.96 4.96 0 0 0-3.25 1.67 4.6 4.6 0 0 0-1.18 3.4 4.1 4.1 0 0 0 3.28-1.56Zm2.78 8.18c.04 3.33 2.94 4.43 2.97 4.45-.02.08-.46 1.58-1.53 3.13-.92 1.34-1.88 2.67-3.38 2.7-1.48.03-1.96-.87-3.65-.87-1.7 0-2.22.84-3.62.9-1.46.05-2.57-1.45-3.5-2.79-1.9-2.73-3.34-7.72-1.4-11.08A5.41 5.41 0 0 1 8.5 5.37c1.43-.03 2.78.96 3.65.96.87 0 2.5-1.18 4.23-1.01.72.03 2.74.29 4.04 2.18-.1.07-2.41 1.4-2.39 4.19Z" />
            </symbol>

            <symbol id="android" viewBox="0 0 24 24">
                <path fill="currentColor" fillRule="evenodd" d="M6.6 17.25C6.6 17.7312 7.005 18.125 7.5 18.125H8.4V21.1875C8.4 21.9137 9.003 22.5 9.75 22.5C10.497 22.5 11.1 21.9137 11.1 21.1875V18.125H12.9V21.1875C12.9 21.9137 13.503 22.5 14.25 22.5C14.997 22.5 15.6 21.9137 15.6 21.1875V18.125H16.5C16.995 18.125 17.4 17.7312 17.4 17.25V8.49995H6.6V17.25V17.25ZM3.85 8.49995C3.103 8.49995 2.5 9.0862 2.5 9.81245V15.9375C2.5 16.6637 3.103 17.25 3.85 17.25C4.597 17.25 5.2 16.6637 5.2 15.9375V9.81245C5.2 9.0862 4.597 8.49995 3.85 8.49995V8.49995ZM20.15 8.49995C19.403 8.49995 18.8 9.0862 18.8 9.81245V15.9375C18.8 16.6637 19.403 17.25 20.15 17.25C20.897 17.25 21.5 16.6637 21.5 15.9375V9.81245C21.5 9.0862 20.897 8.49995 20.15 8.49995V8.49995ZM15.177 3.08995L16.347 1.95245C16.527 1.77745 16.527 1.5062 16.347 1.3312C16.167 1.1562 15.888 1.1562 15.708 1.3312L14.376 2.6262C13.665 2.2762 12.855 2.07495 12 2.07495C11.136 2.07495 10.326 2.2762 9.60598 2.6262L8.26498 1.3312C8.08498 1.1562 7.80598 1.1562 7.62598 1.3312C7.44598 1.5062 7.44598 1.77745 7.62598 1.95245L8.80498 3.0987C7.47298 4.05245 6.59998 5.5837 6.59998 7.32495H17.4C17.4 5.5837 16.527 4.0437 15.177 3.08995V3.08995ZM10.2 5.57495H9.29999V4.69995H10.2V5.57495V5.57495ZM14.7 5.57495H13.8V4.69995H14.7V5.57495V5.57495Z" />
            </symbol>

            <symbol id="circle" viewBox="0 0 24 24">
                <path fill="currentColor" fillRule="evenodd" clipRule="evenodd" d="M2.5 12C2.5 6.75329 6.75329 2.5 12 2.5C17.2467 2.5 21.5 6.75329 21.5 12C21.5 17.2467 17.2467 21.5 12 21.5C6.75329 21.5 2.5 17.2467 2.5 12ZM18.5 12C18.5 8.41015 15.5899 5.5 12 5.5C8.41015 5.5 5.5 8.41015 5.5 12C5.5 15.5899 8.41015 18.5 12 18.5C15.5899 18.5 18.5 15.5899 18.5 12Z" />
            </symbol>

            <symbol id="checkmark" viewBox="0 0 24 24">
                <path fill="currentColor" fillRule="evenodd" clipRule="evenodd" d="M20.9842 4.86804C21.6094 5.4116 21.6755 6.35904 21.132 6.98421L10.6987 18.9842C10.4212 19.3034 10.0219 19.4905 9.5991 19.4997C9.1763 19.5088 8.76928 19.339 8.47828 19.0322L2.91156 13.1617C2.34153 12.5606 2.36674 11.6112 2.96787 11.0412C3.569 10.4711 4.51841 10.4963 5.08845 11.0975L9.51856 15.7693L18.868 5.01584C19.4116 4.39066 20.359 4.32449 20.9842 4.86804Z" />
            </symbol>

            <symbol id="popup-loading" viewBox="0 0 24 24">
                <path stroke="currentColor" fill="currentColor" d="M3.274 14.842c-.433.141-.673.609-.497 1.03a10.002 10.002 0 1 0 2.83-11.565c-.35.291-.353.817-.034 1.142.32.326.84.327 1.195.041a8.352 8.352 0 1 1-2.415 9.867c-.183-.417-.645-.656-1.079-.515Z" strokeLinecap="round" />
            </symbol>
        </svg>
    );
};
