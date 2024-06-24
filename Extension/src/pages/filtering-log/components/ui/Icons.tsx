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

import React from 'react';

export const Icons = () => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" display="none">
            <symbol id="arrow-down" viewBox="0 0 24 24">
                <path stroke="currentColor" fill="none" d="M8.0354 10.9305L11.965 14.9997L16.0342 11.0702" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </symbol>

            <symbol id="ban" viewBox="0 0 16 16">
                <path stroke="currentColor" fill="none" fillRule="evenodd" clipRule="evenodd" d="M8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path stroke="currentColor" fill="none" d="M2.22 13.84 13.55 2.51" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </symbol>

            <symbol id="arrow-status" viewBox="0 0 16 16">
                <path stroke="currentColor" fill="none" d="M11.7 4.67 14.67 8H1.33M11.7 11.33 14.67 8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </symbol>

            <symbol id="transfer-status" viewBox="0 0 16 16">
                <path stroke="currentColor" fill="none" d="m10 3 2 2M10 7l2-2M12 5H4M6 9l-2 2M6 13l-2-2M4 11h8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </symbol>

            <symbol id="record" viewBox="0 0 24 24">
                <path stroke="currentColor" fill="currentColor" d="M9.5 12a2.5 2.5 0 1 1 5 0 2.5 2.5 0 0 1-5 0Z" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                <circle stroke="currentColor" fill="none" cx="12" cy="12" r="8.33" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </symbol>
        </svg>
    );
};