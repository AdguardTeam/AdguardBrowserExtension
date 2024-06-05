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

            <symbol id="checked" viewBox="0 0 12 9">
                <path d="m4.05 8.12903226 4.47096774 4.47096774 5.42903226-7.02580645" fill="none" stroke="#fff" strokeLinecap="round" strokeWidth="1.08" transform="translate(-3 -5)" />
            </symbol>

            <symbol id="logo" viewBox="0 0 160 35">
                <g fill="none" fillRule="evenodd">
                    <g fill="currentColor">
                        <path d="m125.470968 24.653125-1.21659-3.040625h-6.06083l-1.15023 3.040625h-4.114286l6.569585-15.4875h3.67189l6.503226 15.4875zm-4.202765-11.353125-1.990784 5.315625h3.937328z" />
                        <path d="m112.309677 18.8125c0 .933338-.158523 1.7828087-.475576 2.5484375-.317052.7656288-.770504 1.4218723-1.360368 1.96875-.589865.5468777-1.301379.973436-2.134563 1.2796875-.833183.3062515-1.75852.459375-2.776036.459375-1.032264 0-1.961287-.1531235-2.787097-.459375-.825811-.3062515-1.526265-.7328098-2.101383-1.2796875s-1.0175096-1.2031212-1.3271886-1.96875c-.3096789-.7656288-.4645161-1.6150995-.4645161-2.5484375v-9.646875h3.7603687v9.340625c0 .4229188.055299.8239564.165899 1.203125.110599.3791686.280183.7182277.508755 1.0171875.228573.2989598.530874.5359366.906913.7109375s.82949.2625 1.360368.2625c.530879 0 .98433-.0874991 1.360369-.2625s.682027-.4119777.917972-.7109375c.235946-.2989598.40553-.6380189.508756-1.0171875.103227-.3791686.154839-.7802062.154839-1.203125v-9.340625h3.782488z" />
                        <path d="m96.7889401 23.7125c-.7668241.393752-1.6626677.7145821-2.6875576.9625s-2.1419295.371875-3.3511521.371875c-1.2534625 0-2.407368-.196873-3.4617511-.590625-1.0543832-.393752-1.9612866-.9479131-2.7207374-1.6625s-1.3529932-1.5713492-1.7806451-2.5703125-.6414747-2.1109314-.6414747-3.3359375c0-1.2395895.2175094-2.362495.6525346-3.36875s1.0359408-1.8630173 1.802765-2.5703125c.7668241-.7072952 1.6663542-1.25051894 2.6986175-1.6296875 1.0322632-.37916856 2.1456161-.56875 3.3400921-.56875 1.2387159 0 2.3889348.18593564 3.4506913.5578125 1.0617564.37187686 1.9244206.871351 2.5880184 1.4984375l-2.3889401 2.690625c-.3686654-.4229188-.8552965-.7692695-1.4599078-1.0390625s-1.2903188-.4046875-2.0571429-.4046875c-.6635978 0-1.2755732.1203113-1.8359447.3609375-.5603714.2406262-1.0470025.5760395-1.4599078 1.00625s-.7336394.940622-.962212 1.53125-.3428571 1.235934-.3428571 1.9359375c0 .7145869.1032247 1.3708303.3096774 1.96875.2064526.5979197.5124404 1.111977.9179723 1.5421875.405532.4302105.9069095.7656238 1.5041475 1.00625s1.2792588.3609375 2.0460829.3609375c.4423986 0 .8626709-.0328122 1.2608295-.0984375.3981587-.0656253.7668186-.1713534 1.1059908-.3171875v-2.821875h-2.9861751v-3.01875h6.4589862z" />
                        <path d="m159.306912 16.865625c0 1.3562568-.254375 2.5265576-.763133 3.5109375-.508759.9843799-1.17972 1.7937468-2.012903 2.428125-.833184.6343782-1.773267 1.1010402-2.820277 1.4s-2.10875.4484375-3.185253.4484375h-5.839632v-15.4875h5.662673c1.105996 0 2.19723.12760289 3.273733.3828125s2.035019.678122 2.875576 1.26875 1.518891 1.3817659 2.035023 2.3734375c.516131.9916716.774193 2.2166594.774193 3.675zm-3.937327 0c0-.8750044-.143777-1.600518-.431336-2.1765625s-.670966-1.035415-1.150231-1.378125-1.024881-.5869784-1.636866-.7328125-1.242393-.21875-1.891244-.21875h-1.880185v9.05625h1.791706c.678344 0 1.330872-.0765617 1.957603-.2296875s1.179721-.4046858 1.658986-.7546875c.479265-.3500018.862672-.8166638 1.150231-1.4.287559-.5833363.431336-1.305204.431336-2.165625z" />
                        <path d="m80.4866359 16.865625c0 1.3562568-.2543753 2.5265576-.7631336 3.5109375s-1.1797193 1.7937468-2.0129032 2.428125-1.7732667 1.1010402-2.8202765 1.4c-1.0470099.2989598-2.1087504.4484375-3.1852535.4484375h-5.8396313v-15.4875h5.6626728c1.1059963 0 2.1972296.12760289 3.2737327.3828125s2.0350189.678122 2.8755761 1.26875c.8405571.590628 1.5188914 1.3817659 2.035023 2.3734375s.7741935 2.2166594.7741935 3.675zm-3.9373271 0c0-.8750044-.1437774-1.600518-.4313365-2.1765625-.287559-.5760445-.6709653-1.035415-1.1502304-1.378125-.479265-.34271-1.0248817-.5869784-1.6368663-.7328125-.6119847-.1458341-1.2423931-.21875-1.8912443-.21875h-1.8801843v9.05625h1.7917051c.6783444 0 1.3308724-.0765617 1.9576037-.2296875.6267312-.1531258 1.1797211-.4046858 1.6589861-.7546875.4792651-.3500018.8626714-.8166638 1.1502304-1.4.2875591-.5833363.4313365-1.305204.4313365-2.165625z" />
                        <path d="m60.4682028 24.653125-1.2165899-3.040625h-6.0608295l-1.1502304 3.040625h-4.1142857l6.5695852-15.4875h3.6718894l6.5032258 15.4875zm-4.202765-11.353125-1.9907834 5.315625h3.9373272z" />
                        <path d="m139.251613 24.653125-3.384332-6.146875h-1.282949v6.146875h-3.716129v-15.4875h5.97235c.752077 0 1.485711.07656173 2.200922.2296875s1.356679.41197734 1.924424.7765625c.567744.3645852 1.021196.8458303 1.360368 1.44375s.508756 1.3416622.508756 2.23125c0 1.0500052-.287555 1.9322881-.862673 2.646875s-1.371423 1.2249985-2.38894 1.53125l4.092166 6.628125zm-.154839-10.740625c0-.3645852-.077418-.6598947-.232258-.8859375-.154839-.2260428-.353916-.401041-.597235-.525s-.516127-.2078123-.818433-.2515625-.593547-.065625-.873733-.065625h-2.012903v3.609375h1.791705c.309679 0 .626727-.0255206.951152-.0765625.324426-.0510419.619354-.1421868.884793-.2734375s.482948-.3208321.652534-.56875.254378-.568748.254378-.9625z" />
                    </g>
                    <path d="m17.1543031 0c-5.3619081 0-11.8297098 1.25180851-17.15429784 4.00712766 0 5.95074468-.07349775 20.77585104 17.15429784 30.90537234 17.2281765-10.1295213 17.1550595-24.95462766 17.1550595-30.90537234-5.3249688-2.75531915-11.7927705-4.00712766-17.1550595-4.00712766z" fill="#68bc71" />
                    <path d="m17.1367803 34.9021919c-17.21022294-10.1292683-17.13677504-24.9463378-17.13677504-30.89506424 5.31878904-2.75231834 11.77830294-4.00439919 17.13677504-4.00712321v34.90219085z" fill="#67b279" />
                    <path d="m16.5285819 23.2947567 10.3734917-13.88033502c-.7601484-.60488994-1.4269071-.17797112-1.7939502.15254668l-.0133931.00105935-8.6494027 8.93280849-3.2588648-3.8934714c-1.5546844-1.7832424-3.66825892-.4230346-4.1619934-.0635611z" fill="#fff" />
                </g>
            </symbol>

            <symbol id="magnifying" viewBox="0 0 24 24">
                <circle cx="9.5" cy="9.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <path d="M14 14L19 19" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </symbol>

            <symbol id="tick" viewBox="0 0 24 24">
                <g fill="none" fillRule="evenodd">
                    <path stroke="#67B279" d="m5 12 6 6 8-9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </g>
            </symbol>

            <symbol id="trash" viewBox="0 0 14 17">
                <g fill="none" fillRule="evenodd" stroke="currentColor" transform="translate(1 1)">
                    <path d="m.54 3.5.888 11.538a.5.5 0 0 0 .498.462h8.148a.5.5 0 0 0 .498-.462l.888-11.538z" />
                    <g strokeLinecap="round">
                        <path d="m0 1.5h12" />
                        <path d="m4 0v1h4v-1" strokeLinejoin="round" transform="matrix(-1 0 0 -1 12 1)" />
                    </g>
                    <path d="m7.5 6v7zm-3 0v7z" strokeLinejoin="round" />
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

            {/* FIXME: move to page/filtering-log components/ui/Icons as it is not common, and used only there */}
            <symbol id="arrow-bottom" viewBox="0 0 24 24">
                <path d="M8.0354 10.9305L11.965 14.9997L16.0342 11.0702" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </symbol>

            <symbol id="extend" viewBox="0 0 24 24">
                <rect width="24" height="24" fill="none" />
                <path d="M6 10V6H10M6 14V18H10M18 10V6H14M18 14V18H14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </symbol>

            <symbol id="line-break-on" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M4.08398 4.73584C3.66977 4.73584 3.33398 5.07163 3.33398 5.48584C3.33398 5.90005 3.66977 6.23584 4.08398 6.23584H19.6176C20.0318 6.23584 20.3676 5.90005 20.3676 5.48584C20.3676 5.07163 20.0318 4.73584 19.6176 4.73584H4.08398ZM4 8.95654C3.58579 8.95654 3.25 9.29233 3.25 9.70654C3.25 10.1208 3.58579 10.4565 4 10.4565H12C12.026 10.4565 12.0517 10.4552 12.077 10.4526H15.5396C17.3324 10.4526 18.7857 11.906 18.7857 13.6987C18.7857 15.4833 17.3456 16.9316 15.5641 16.9447L16.2941 16.2144C16.5869 15.9215 16.5868 15.4466 16.2939 15.1538C16.0009 14.861 15.5261 14.8611 15.2332 15.154L13.2915 17.0966C12.9988 17.3894 12.9988 17.8641 13.2915 18.157L15.2332 20.0996C15.5261 20.3925 16.0009 20.3926 16.2939 20.0998C16.5868 19.807 16.5869 19.3321 16.2941 19.0391L15.6975 18.4422C18.2456 18.359 20.2857 16.2671 20.2857 13.6987C20.2857 11.0775 18.1608 8.95264 15.5396 8.95264H10V8.95654H4ZM3.33398 13.7417C3.33398 13.3275 3.66977 12.9917 4.08398 12.9917H10.8799C11.2941 12.9917 11.6299 13.3275 11.6299 13.7417C11.6299 14.1559 11.2941 14.4917 10.8799 14.4917H4.08398C3.66977 14.4917 3.33398 14.1559 3.33398 13.7417ZM3.33398 17.6265C3.33398 17.2123 3.66977 16.8765 4.08398 16.8765H10.8799C11.2941 16.8765 11.6299 17.2123 11.6299 17.6265C11.6299 18.0407 11.2941 18.3765 10.8799 18.3765H4.08398C3.66977 18.3765 3.33398 18.0407 3.33398 17.6265Z" fill="currentColor" />
            </symbol>

            <symbol id="line-break-off" viewBox="0 0 24 24">
                <path d="M4 6H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M4 18H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M4 14H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M4 10H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </symbol>

            <symbol id="info" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="9" stroke="currentColor" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 16V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M11.997 7.59552C12.009 7.59745 11.997 7.40446 11.997 7.40446" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </symbol>

            <symbol id="reduce" viewBox="0 0 24 24">
                <rect width="24" height="24" fill="none" />
                <path d="M10 6V10H6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M10 18V14H6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M14 6V10H18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M14 18V14H18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </symbol>

            {/* FIXME: move to page/filtering-log components/ui/Icons as it is not common, and used only there */}
            <symbol id="ban" viewBox="0 0 16 16">
                <path fillRule="evenodd" clipRule="evenodd" d="M8 14C11.3137 14 14 11.3137 14 8C14 6.34315 13.3284 4.84315 12.2426 3.75736C11.69 3.20469 11.03 2.75934 10.2966 2.45524C9.58921 2.1619 8.81351 2 8 2C4.68629 2 2 4.68629 2 8C2 8.81351 2.1619 9.58921 2.45524 10.2966C2.75934 11.03 3.20469 11.69 3.75736 12.2426C4.84315 13.3284 6.34315 14 8 14Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2.21513 13.8442L13.5485 2.51087" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </symbol>

            {/* FIXME: move to page/filtering-log components/ui/Icons as it is not common, and used only there */}
            <symbol id="arrow-status" viewBox="0 0 16 16">
                <path d="M11.7038 4.66663L14.6667 7.99996L1.33341 7.99996" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M11.7038 11.3334L14.6667 8.00004" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </symbol>

            {/* FIXME: move to page/filtering-log components/ui/Icons as it is not common, and used only there */}
            <symbol id="transfer-status" viewBox="0 0 16 16">
                <path d="M10.3333 2.66663L12.3333 4.66663" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M10.3333 6.66663L12.3333 4.66663" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12.3334 4.66671H3.66675" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M5.66675 9.33337L3.66675 11.3334" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M5.66675 13.3334L3.66675 11.3334" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M3.66659 11.3333H12.3333" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </symbol>

            {/* FIXME: move to page/filtering-log components/ui/Icons as it is not common, and used only there */}
            <symbol id="arrow-scrollbar" viewBox="0 0 32 32">
                <rect width="32" height="32" fill="none" />
                <path d="M13.8958 21.9468L19.9996 16.0524L14.1052 9.9486" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </symbol>

            {/* FIXME: move to page/filtering-log components/ui/Icons as it is not common, and used only there */}
            <symbol id="radio" viewBox="0 0 24 24">
                <path d="M9.5 12C9.5 10.6196 10.6188 9.50046 11.9991 9.5C13.3795 9.5021 14.4979 10.6206 14.5 12.0009C14.4995 13.3812 13.3804 14.5 12 14.5C10.6193 14.5 9.5 13.3807 9.5 12Z" fill="currentColor" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12.0001" cy="12" r="8.33333" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </symbol>

            <symbol id="loading" viewBox="0 0 24 24">
                <path fill="none" stroke="#67B279" d="M6.29054 5.04252c.11374-.09345.22981-.18417.34812-.27205M8.55511 3.68292c.2649-.10985.53619-.20741.81315-.29197.14206-.04337.28562-.08333.43057-.11976M12 3c4.9706 0 9 4.02944 9 9 0 4.9706-4.0294 9-9 9-2.48528 0-4.73528-1.0074-6.36396-2.636-.829-.829-1.49703-1.819-1.95318-2.9191" />
            </symbol>
        </svg>
    );
};
