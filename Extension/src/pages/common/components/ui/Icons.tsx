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

            <symbol id="logo" viewBox="0 0 107 24">
                <g fill="none" fillRule="evenodd">
                    {/* the shield with the brand color */}
                    <path fill="#67b279" d="M12.4997 0C8.74899 0 4.22465.860534.500004 2.75463.500004 6.84537.448591 17.0366 12.4997 24 24.5511 17.0366 24.5 6.84537 24.5 2.75463 20.7751.860534 16.2507 0 12.4997 0Z" />
                    {/* left (shadowed) part of the shield */}
                    <path fill="#5b9f6b" d="M12.5 0h-.0003C8.74898 0 4.22464.860534.500002 2.75463v.05192C.499784 6.931.499251 17.0659 12.4997 24c.0001-.0001.0002-.0001.0003-.0002V0Z" />
                    {/* the check sign on the shield */}
                    <path fill="#fff" d="m12.3942 15.4286 6.963-9.22598c-.5103-.40206-.9578-.1183-1.2042.10139l-.009.0007-5.8057 5.93749-2.1875-2.58795C9.10728 8.46897 7.68859 9.37307 7.35718 9.612l5.03702 5.8166Z" />
                    {/* the text "ADGUARD" */}
                    <path fill="currentColor" d="M57.1774 17.4737c-1.6568 0-3.006-.5141-4.0479-1.5423-1.0418-1.0282-1.5627-2.3387-1.5627-3.9314 0-1.5222.5336-2.81497 1.6008-3.87846 1.0673-1.0635 2.3988-1.59523 3.9946-1.59523.9249 0 1.7075.11844 2.3479.35533.6403.23689 1.2553.60231 1.8448 1.09625L59.876 9.74701c-.4472-.37298-.8792-.64515-1.2959-.81652-.4168-.17137-.9148-.25705-1.4942-.25705-.8538 0-1.578.32509-2.1726.97529-.5946.65017-.8919 1.43397-.8919 2.35127 0 .9677.3024 1.7691.9072 2.4042.6048.635 1.3798.9526 2.325.9526.8742 0 1.6111-.2117 2.2107-.6351v-1.5121h-2.3631v-2.011h4.6348v4.5967c-1.3315 1.1189-2.851 1.6784-4.5586 1.6784ZM32.5739 6.63214 28 17.2922h2.3937l.9757-2.3739h4.5129l.9758 2.3739h2.4546L34.7389 6.63214h-2.165Zm1.052 2.7973 1.4179 3.43236h-2.8359l1.418-3.43236Zm6.9122 7.86276V6.70776h4.1623c1.6669 0 3.0289.5015 4.086 1.50451C49.8435 9.21528 50.372 10.4778 50.372 12c0 1.5121-.5311 2.7721-1.5932 3.7802-1.0622 1.008-2.4216 1.512-4.0784 1.512h-4.1623Zm4.1621-2.1017h-1.8143V8.80954h1.8143c.9555 0 1.7305.29737 2.3251.89212.5946.59474.8919 1.36084.8919 2.29834 0 .9476-.2948 1.7162-.8843 2.3059-.5895.5897-1.3671.8846-2.3327.8846Zm20.3443 1.066c.8131.8014 1.9464 1.2021 3.3999 1.2021 1.4636 0 2.6096-.4033 3.438-1.2097.8284-.8064 1.2426-1.9959 1.2426-3.5685V6.70776h-2.3479v6.06344c0 .8266-.2008 1.4566-.6023 1.89-.4014.4335-.9681.6502-1.6999.6502s-1.2985-.2243-1.7-.6728c-.4015-.4486-.6022-1.0963-.6022-1.943V6.70776h-2.3479V12.756c0 1.5323.4065 2.6991 1.2197 3.5005Zm8.7169 1.0357 4.5738-10.66006h2.165l4.5739 10.66006h-2.4547l-.9757-2.3739h-4.5129l-.9758 2.3739h-2.3936Zm5.6258-7.86276 1.4179 3.43236h-2.8358l1.4179-3.43236Zm6.9123-2.72168h4.8788c1.3519 0 2.3886.35786 3.1103 1.07357.6098.60483.9147 1.42134.9147 2.44957 0 1.6229-.7623 2.7167-2.2869 3.2812l2.6071 3.7801h-2.7443l-2.3175-3.387h-1.8143v3.387h-2.3479V6.70776Zm4.7262 5.14104h-2.3784V8.80954H90.98c.5793 0 1.0316.12852 1.3569.38558.3252.25705.4879.63254.4879 1.12648 0 .4637-.1576.8342-.4727 1.1114-.3151.2772-.7572.4158-1.3264.4158Zm5.8754-5.14104h4.1619c1.667 0 3.029.5015 4.086 1.50451 1.057 1.00301 1.586 2.26553 1.586 3.78773 0 1.5121-.531 2.7721-1.593 3.7802-1.062 1.008-2.422 1.512-4.079 1.512h-4.1619V6.70776Zm4.1619 8.48274h-1.8139V8.80954h1.8139c.956 0 1.731.29737 2.325.89212.595.59474.892 1.36084.892 2.29834 0 .9476-.294 1.7162-.884 2.3059-.589.5897-1.367.8846-2.333.8846Z" />
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
        </svg>
    );
};
