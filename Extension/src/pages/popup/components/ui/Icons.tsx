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
                    <path stroke="currentColor" clipRule="evenodd" d="M7.92921 18.9146c.1353 0 .26857.0329.38831.0959.42559.224.87078.4087 1.33001.5516.26555.0825.47247.292.55157.5586.2539.8545.4948 1.4936.6529 1.8793h2.296c.1581-.3865.3995-1.0258.6531-1.8801.0792-.2665.2861-.4761.5516-.5586.4593-.1429.9045-.3276 1.33-.5516.2462-.1297.5409-.1279.7855.0047.7839.425 1.4063.7063 1.791.8678l1.624-1.6231c-.1617-.3851-.4427-1.0078-.868-1.7918-.1326-.2446-.1343-.5392-.0047-.7854.2241-.4256.4087-.8708.5516-1.3301.0825-.2655.2921-.4724.5586-.5516.8545-.2539 1.4936-.4948 1.8793-.6529v-2.2959c-.3865-.1581-1.0256-.3995-1.88-.6532-.2666-.0792-.4761-.28606-.5587-.55161-.1429-.45924-.3275-.90444-.5516-1.33003-.1296-.24619-.1279-.54085.0047-.78547.425-.78391.7063-1.40634.8675-1.791L18.2597 4.1168c-.3852.16147-1.0079.44274-1.7918.86803-.2446.13259-.5392.13435-.7854.00469-.4256-.22404-.8708-.40868-1.33-.5516-.2656-.08252-.4725-.29206-.5516-.55863C13.5472 3.02507 13.3061 2.3857 13.148 2h-2.296c-.1562.38492-.3974 1.02064-.6511 1.86965-.0767.27131-.28541.48542-.55467.56905-.45922.14284-.90441.32739-1.33002.55134-.24618.12966-.54083.1279-.78545-.00469-.7839-.42503-1.40633-.7063-1.79098-.8675l-1.623 1.6225c.16146.38518.44273 1.00788.86801 1.79178.13259.24462.13434.53928.00469.78547-.22395.4256-.40849.8708-.55133 1.33003-.08252.26555-.29205.47247-.55863.55157-.85447.2537-1.49356.4949-1.87952.6529v2.296c.38387.1563 1.01568.3961 1.86208.6477.28222.0773.50343.2966.5831.5782.1402.4457.31964.8782.53623 1.2923.14237.2565.13941.5689-.00782.8227-.41851.7737-.69613 1.3889-.85603 1.7709l1.62326 1.6243c.38518-.1614 1.00786-.4427 1.79176-.868.12171-.0663.25803-.1012.39663-.1016Z" strokeWidth="1.5" strokeLinejoin="round" />
                    <path stroke="currentColor" clipRule="evenodd" d="M12 9.27271c-1.5063 0-2.72729 1.22099-2.72729 2.72729 0 1.5062 1.22099 2.7273 2.72729 2.7273 1.5062 0 2.7273-1.2211 2.7273-2.7273-.0018-1.5055-1.2218-2.72553-2.7273-2.72729Z" strokeWidth="1.5" strokeLinejoin="round" />
                </g>
            </symbol>

            <symbol id="block-ad" viewBox="0 0 24 24">
                <g fill="none" fillRule="evenodd">
                    <path clipRule="evenodd" d="M3 8c0-.55228.44772-1 1-1h16c.5523 0 1 .44772 1 1v8c0 .5523-.4477 1-1 1H4c-.55228 0-1-.4477-1-1V8Z" stroke="#E9653A" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M4 21 20 3" stroke="#E9653A" strokeWidth="1.5" strokeLinecap="round" />
                </g>
            </symbol>

            <symbol id="sandwich" viewBox="0 0 24 24">
                <g fill="none" fillRule="evenodd">
                    <path d="M4 6h16M4 10h12M4 14h16M4 18h8" stroke="#67B279" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </g>
            </symbol>

            <symbol id="thumb-down" viewBox="0 0 24 24">
                <g fill="none" fillRule="evenodd">
                    <path clipRule="evenodd" d="M16.4791 11.24c.0627.5082.0627 1.0164-.1252 1.4611-.2505.6988-.0626 4.3835.0626 5.2729.0626.2542.2505.6353.4384.953l.1792.3616c.2664.5593.4527 1.1688-.3671 1.4807-2.8806 1.0165-3.4442-1.5247-3.8199-3.7482-.1879-.7623-.1253-1.0165-.4384-1.2706l-.3483.3116c-1.0201.9074-2.31473 1.9755-3.65944 1.9755-1.4403 0-1.81603-.953-1.87865-1.5247-1.00195-.2541-1.56554-1.5247-1.31505-2.4777-.75146-.5082-.93933-1.5247-.62622-2.3505-.31311-.4447-.93932-1.6518-.31311-2.60474.50098-.69882 7.51457-4.51056 8.32867-4.82821.0626-.4447.3757-.82587.7515-1.07999l1.6281-.95294c.7515-.4447 1.6908-.19058 2.0665.57176l3.0685 5.27292c.3757.76235.1252 1.71528-.5636 2.16l-1.6908.9529c-.4383.2541-.9393.2541-1.3777.0636Z" stroke="#D58500" strokeWidth="1.5" strokeLinejoin="round" />
                    <path d="M12.5 4.50004 16.4791 11.24" stroke="#D58500" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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
                    <path d="M6.42857 6.42857 17.6043 17.6043M6.42856 17.5714 17.6043 6.39563" stroke="#E9653A" strokeWidth="1.5" strokeLinecap="round" />
                </g>
            </symbol>

            <symbol id="apple" viewBox="0 0 24 24">
                <path fill="currentColor" d="M14.8902 4.03331C15.5764 3.23057 16.0389 2.11243 15.9124 1C14.9235 1.038 13.7272 1.63744 13.0182 2.43923C12.3815 3.15077 11.8257 4.2879 11.9751 5.37849C13.0782 5.46114 14.204 4.837 14.8902 4.03331M17.3638 11.0936C17.3914 13.9692 19.9715 14.9259 20 14.9382C19.9791 15.0057 19.5879 16.3014 18.641 17.6409C17.8215 18.798 16.9717 19.9503 15.6326 19.975C14.3173 19.9988 13.8938 19.2208 12.3892 19.2208C10.8854 19.2208 10.4153 19.9503 9.17045 19.9988C7.87802 20.0453 6.893 18.7467 6.06786 17.5934C4.37952 15.2346 3.08994 10.9274 4.82206 8.02041C5.68241 6.57738 7.21943 5.66254 8.88874 5.63974C10.1574 5.61599 11.3556 6.46528 12.1312 6.46528C12.9069 6.46528 14.363 5.44404 15.8934 5.59414C16.5339 5.61979 18.3326 5.84399 19.487 7.47891C19.3938 7.53496 17.3409 8.69015 17.3638 11.0936" />
            </symbol>

            <symbol id="android" viewBox="0 0 24 24">
                <path fill="currentColor" fillRule="evenodd" d="M6.6 17.25C6.6 17.7312 7.005 18.125 7.5 18.125H8.4V21.1875C8.4 21.9137 9.003 22.5 9.75 22.5C10.497 22.5 11.1 21.9137 11.1 21.1875V18.125H12.9V21.1875C12.9 21.9137 13.503 22.5 14.25 22.5C14.997 22.5 15.6 21.9137 15.6 21.1875V18.125H16.5C16.995 18.125 17.4 17.7312 17.4 17.25V8.49995H6.6V17.25V17.25ZM3.85 8.49995C3.103 8.49995 2.5 9.0862 2.5 9.81245V15.9375C2.5 16.6637 3.103 17.25 3.85 17.25C4.597 17.25 5.2 16.6637 5.2 15.9375V9.81245C5.2 9.0862 4.597 8.49995 3.85 8.49995V8.49995ZM20.15 8.49995C19.403 8.49995 18.8 9.0862 18.8 9.81245V15.9375C18.8 16.6637 19.403 17.25 20.15 17.25C20.897 17.25 21.5 16.6637 21.5 15.9375V9.81245C21.5 9.0862 20.897 8.49995 20.15 8.49995V8.49995ZM15.177 3.08995L16.347 1.95245C16.527 1.77745 16.527 1.5062 16.347 1.3312C16.167 1.1562 15.888 1.1562 15.708 1.3312L14.376 2.6262C13.665 2.2762 12.855 2.07495 12 2.07495C11.136 2.07495 10.326 2.2762 9.60598 2.6262L8.26498 1.3312C8.08498 1.1562 7.80598 1.1562 7.62598 1.3312C7.44598 1.5062 7.44598 1.77745 7.62598 1.95245L8.80498 3.0987C7.47298 4.05245 6.59998 5.5837 6.59998 7.32495H17.4C17.4 5.5837 16.527 4.0437 15.177 3.08995V3.08995ZM10.2 5.57495H9.29999V4.69995H10.2V5.57495V5.57495ZM14.7 5.57495H13.8V4.69995H14.7V5.57495V5.57495Z" />
            </symbol>

            <symbol id="cross-white" width="24" height="24">
                <path stroke="#f3f3f3" strokeLinecap="round" strokeWidth="1.5" d="m6.429 6.429 11.175 11.175M6.429 17.571 17.605 6.396" />
            </symbol>

            <symbol id="play" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M19 12L7 20L7 4L19 12Z" stroke="#a4a4a4" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="#fff" />
            </symbol>

            <symbol id="circle" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M2.5 12C2.5 6.75329 6.75329 2.5 12 2.5C17.2467 2.5 21.5 6.75329 21.5 12C21.5 17.2467 17.2467 21.5 12 21.5C6.75329 21.5 2.5 17.2467 2.5 12ZM18.5 12C18.5 8.41015 15.5899 5.5 12 5.5C8.41015 5.5 5.5 8.41015 5.5 12C5.5 15.5899 8.41015 18.5 12 18.5C15.5899 18.5 18.5 15.5899 18.5 12Z" fill="#c23814" />
            </symbol>

            <symbol id="checkmark" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M20.9842 4.86804C21.6094 5.4116 21.6755 6.35904 21.132 6.98421L10.6987 18.9842C10.4212 19.3034 10.0219 19.4905 9.5991 19.4997C9.1763 19.5088 8.76928 19.339 8.47828 19.0322L2.91156 13.1617C2.34153 12.5606 2.36674 11.6112 2.96787 11.0412C3.569 10.4711 4.51841 10.4963 5.08845 11.0975L9.51856 15.7693L18.868 5.01584C19.4116 4.39066 20.359 4.32449 20.9842 4.86804Z" fill="#67b279" />
            </symbol>

            <symbol id="popup-loading" viewBox="0 0 24 24">
                <path stroke="#67B279" fill="#67B279" d="M3.274 14.842c-.433.141-.673.609-.497 1.03a10.002 10.002 0 1 0 2.83-11.565c-.35.291-.353.817-.034 1.142.32.326.84.327 1.195.041a8.352 8.352 0 1 1-2.415 9.867c-.183-.417-.645-.656-1.079-.515Z" strokeLinecap="round" />
            </symbol>

            <symbol id="lock" viewBox="0 0 48 48">
                <g fill="none" fillRule="evenodd">
                    <path clipRule="evenodd" d="M10 20.8c0 4 0 21.2 14 21.2s14-17.2 14-21.2a36.7 36.7 0 0 0-28 0Z" stroke="#67B279" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M24 28v4M16 18c0-5.4 0-12 7.7-12S32 12.4 32 18" stroke="#67B279" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </g>
            </symbol>

            <symbol id="secure-page" viewBox="0 0 48 48">
                <g fill="none" fillRule="evenodd">
                    <path d="m18 22 6 6 8-10" stroke="#67B279" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path clipRule="evenodd" d="M24 6c-6 0-12 1-18 4 0 6 0 22 18 32 18-10 18-26 18-32-6-3-12-4-18-4v0Z" stroke="#67B279" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </g>
            </symbol>
        </svg>
    );
};
