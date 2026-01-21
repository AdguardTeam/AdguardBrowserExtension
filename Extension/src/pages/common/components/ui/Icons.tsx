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

import '../../styles/icons.pcss';

export const Icons = () => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" display="none">
            <symbol id="arrow-left" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <g fill="none" fillRule="evenodd">
                    <path stroke="currentColor" d="m15 18-6-6 6-6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </g>
            </symbol>

            <symbol id="cross" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke="currentColor" d="M6.42857 6.42857L17.6043 17.6043" strokeWidth="1.5" strokeLinecap="round" />
                <path stroke="currentColor" d="M6.42871 17.5714L17.6045 6.39563" strokeWidth="1.5" strokeLinecap="round" />
            </symbol>

            <symbol id="checked" viewBox="0 0 20 20">
                <g fill="none" fillRule="evenodd">
                    <rect fill="#67b279" width="20" height="20" rx="2" />
                    <path stroke="#fff" d="m5.05 9.04 4.47 4.47 5.43-7.02" strokeWidth="1.5" strokeLinecap="round" />
                </g>
            </symbol>

            <symbol id="magnifying" viewBox="0 0 24 24">
                <circle cx="9.5" cy="9.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <path d="M14 14L19 19" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </symbol>

            <symbol id="tick" viewBox="0 0 24 24">
                <g fill="none" fillRule="evenodd">
                    <path stroke="currentColor" d="m5 12 6 6 8-9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </g>
            </symbol>

            <symbol id="trash" viewBox="0 0 24 24">
                <g fill="none" fillRule="evenodd" stroke="currentColor">
                    <path clipRule="evenodd" d="M7 9h10l-.7633 10.0755c-.0395.5215-.4742.9245-.9971.9245H8.76044c-.52298 0-.95763-.403-.99714-.9245L7 9Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M6 6.5h12M14 6V4h-4v2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path clipRule="evenodd" d="M13.5 12v5-5ZM10.5 12v5-5Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </g>
            </symbol>

            <symbol id="reload" viewBox="0 0 24 24">
                <g fill="none" fillRule="evenodd">
                    <path stroke="currentColor" d="M6 6.99999C9.6 1.79999 19.5 3.49996 20 12v1.5M18 16.9999c-3.6 5.2-13.5 3.5001-14-5V11" strokeWidth="1.5" strokeLinecap="round" />
                    <path stroke="currentColor" d="m22 12-2 2-2-2M2 12l2-2 2 2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </g>
            </symbol>

            <symbol id="select" viewBox="0 0 14 8">
                <path d="m6 10 6 6 6-6" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" transform="translate(-5 -9)" />
            </symbol>

            <symbol id="extend" viewBox="0 0 24 24">
                <rect width="24" height="24" fill="none" />
                <path d="M6 10V6H10M6 14V18H10M18 10V6H14M18 14V18H14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </symbol>

            <symbol id="more-vertical" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 7C11.1716 7 10.5 6.32843 10.5 5.5C10.5 4.67157 11.1716 4 12 4C12.8284 4 13.5 4.67157 13.5 5.5C13.5 6.32843 12.8284 7 12 7Z" fill="currentColor" />
                <path fillRule="evenodd" clipRule="evenodd" d="M12 13.5C11.1716 13.5 10.5 12.8284 10.5 12C10.5 11.1716 11.1716 10.5 12 10.5C12.8284 10.5 13.5 11.1716 13.5 12C13.5 12.8284 12.8284 13.5 12 13.5Z" fill="currentColor" />
                <path fillRule="evenodd" clipRule="evenodd" d="M12 20C11.1716 20 10.5 19.3284 10.5 18.5C10.5 17.6716 11.1716 17 12 17C12.8284 17 13.5 17.6716 13.5 18.5C13.5 19.3284 12.8284 20 12 20Z" fill="currentColor" />
            </symbol>

            <symbol id="line-break-on" viewBox="0 0 24 24">
                <path fill="currentColor" fillRule="evenodd" clipRule="evenodd" d="M4.08 4.74a.75.75 0 0 0 0 1.5h15.54a.75.75 0 0 0 0-1.5H4.08ZM4 8.96a.75.75 0 0 0 0 1.5h11.54a3.25 3.25 0 0 1 .02 6.48l.73-.73a.75.75 0 0 0-1.06-1.06L13.3 17.1c-.3.29-.3.76 0 1.06l1.94 1.94a.75.75 0 0 0 1.06-1.06l-.6-.6a4.75 4.75 0 0 0-.15-9.49H4Zm-.67 4.78c0-.41.34-.75.75-.75h6.8a.75.75 0 0 1 0 1.5h-6.8a.75.75 0 0 1-.75-.75Zm0 3.89c0-.42.34-.75.75-.75h6.8a.75.75 0 0 1 0 1.5h-6.8a.75.75 0 0 1-.75-.75Z" />
            </symbol>

            <symbol id="line-break-off" viewBox="0 0 24 24">
                <path stroke="currentColor" d="M4 6h16M4 18h16M4 14h16M4 10h16" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </symbol>

            <symbol id="info" viewBox="0 0 24 24">
                <circle stroke="currentColor" fill="none" cx="12" cy="12" r="9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path stroke="currentColor" d="M12 16V10" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path stroke="currentColor" d="M11.997 7.59552C12.009 7.59745 11.997 7.40446 11.997 7.40446" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </symbol>

            <symbol id="reduce" viewBox="0 0 24 24">
                <g fill="none" fillRule="evenodd">
                    <path stroke="currentColor" d="M10 6v4H6M10 18v-4H6M14 6v4h4M14 18v-4h4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </g>
            </symbol>

            <symbol id="cross" width="24" height="24">
                <path stroke="currentColor" d="M6.429 6.796 17.604 18.61M6.429 18.576 17.605 6.76" />
            </symbol>

            <symbol id="question" width="24" height="24">
                <g fill="none" fillRule="evenodd">
                    <path stroke="currentColor" clipRule="evenodd" d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path stroke="currentColor" d="M10 9.3c.02-.82 1-1.52 2-1.52s1.6.39 2 1.22c.32.7.01 1.55-1.06 2.28-.87.56-1.14 1.13-1.14 2.18M11.8 15.9v-.2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </g>
            </symbol>

            <symbol id="no-filters-found" viewBox="0 0 48 51">
                <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M31.631 18.31a15.16 15.16 0 0 1-4.196 12.723c-5.872 5.999-15.504 6.099-21.503.226-6-5.872-6.108-15.505-.227-21.503 4.377-4.477 10.838-5.673 16.33-3.553M27.436 31.033 47 50.172" />
                    <path d="M31.522 15.564a7.023 7.023 0 1 0 0-14.046 7.023 7.023 0 0 0 0 14.046ZM27.752 4.645l7.54 7.539M27.752 12.157l7.54-7.54" />
                </g>
            </symbol>

            <symbol id="no-filters-yet" viewBox="0 0 63 35">
                <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M54.5 36.886a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z" />
                    <path d="M54.5 26.776v4.67-4.67Z" />
                    <path d="M54.5 26.776v4.67" />
                    <path d="M54.491 33.31v.152-.152Z" />
                    <path d="M54.491 33.31v.152M9.802 10.302V31.84h35.34M52.277 20.591v-9.985M9.802 1.5h42.475M35.086 1.5v30.34" />
                    <path d="m35.283 1.5-8.801 8.802H1L9.802 1.5" />
                    <path d="m34.978 1.805 8.802 8.801h17.594L52.277 1.5" />
                </g>
            </symbol>

            <symbol id="loading" viewBox="0 0 24 24">
                <path fill="none" stroke="currentColor" d="M6.29054 5.04252c.11374-.09345.22981-.18417.34812-.27205M8.55511 3.68292c.2649-.10985.53619-.20741.81315-.29197.14206-.04337.28562-.08333.43057-.11976M12 3c4.9706 0 9 4.02944 9 9 0 4.9706-4.0294 9-9 9-2.48528 0-4.73528-1.0074-6.36396-2.636-.829-.829-1.49703-1.819-1.95318-2.9191" />
            </symbol>

            <symbol id="update-available" viewBox="0 0 24 24">
                <g fill="none" fillRule="evenodd">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="m12 4 7 10.49h-3.5V20h-7v-5.51H5L12 4Z" clipRule="evenodd" />
                </g>
            </symbol>
        </svg>
    );
};
