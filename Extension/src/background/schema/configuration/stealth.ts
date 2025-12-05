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
import zod from 'zod';

// Stealth configuration

export const enum StealthOption {
    DisableStealthMode = 'stealth-disable-stealth-mode',
    HideReferrer = 'stealth-hide-referrer',
    HideSearchQueries = 'stealth-hide-search-queries',
    SendDoNotTrack = 'stealth-send-do-not-track',
    BlockWebRTC = 'stealth-block-webrtc',
    RemoveXClientData = 'stealth-remove-x-client',
    SelfDestructThirdPartyCookies = 'stealth-block-third-party-cookies',
    SelfDestructThirdPartyCookiesTime = 'stealth-block-third-party-cookies-time',
    SelfDestructFirstPartyCookies = 'stealth-block-first-party-cookies',
    SelfDestructFirstPartyCookiesTime = 'stealth-block-first-party-cookies-time',
    BlockKnownTrackers = 'block-known-trackers',
    StripTrackingParams = 'strip-tracking-parameters',
}

export const stealthConfigValidator = zod.object({
    /**
     * Whether Tracking protection (formerly Stealth mode) is disabled or not.
     */
    [StealthOption.DisableStealthMode]: zod.boolean(),
    /**
     * Should the application hide the origin referrer in third-party requests
     * by replacing the referrer url with the url from the requested url.
     */
    [StealthOption.HideReferrer]: zod.boolean(),
    /**
     * Should the application hide the original referrer from the search page
     * containing the search query in third-party queries, replacing
     * the referrer url with the url from the requested url.
     */
    [StealthOption.HideSearchQueries]: zod.boolean(),
    /**
     * Includes HTTP headers 'DNT' and 'Sec-GPC' in all requests.
     *
     * @see https://www.wikiwand.com/en/Do_Not_Track
     * @see https://globalprivacycontrol.org
     */
    [StealthOption.SendDoNotTrack]: zod.boolean(),
    /**
     * Blocks the possibility of leaking your IP address through WebRTC, even if
     * you use a proxy server or VPN.
     */
    [StealthOption.BlockWebRTC]: zod.boolean(),
    /**
     * For Google Chrome, it removes the 'X-Client-Data' header from
     * the requests, which contains information about the browser version
     * and modifications.
     */
    [StealthOption.RemoveXClientData]: zod.boolean(),
    /**
     * Whether or not the application should set a fixed lifetime from
     * `StealthOption.SelfDestructThirdPartyCookiesTime` for third-party
     * cookies.
     */
    [StealthOption.SelfDestructThirdPartyCookies]: zod.boolean(),
    /**
     * Time in milliseconds to delete third-party cookies.
     */
    [StealthOption.SelfDestructThirdPartyCookiesTime]: zod.number(),
    /**
     * Whether or not the application should set a fixed lifetime from
     * `StealthOption.SelfDestructFirstPartyCookiesTime` for first-party
     * cookies.
     */
    [StealthOption.SelfDestructFirstPartyCookies]: zod.boolean(),
    /**
     * Time in milliseconds to delete first-party cookies.
     */
    [StealthOption.SelfDestructFirstPartyCookiesTime]: zod.number(),
    /**
     * If true application will enable AdGuard Tracking Protection filter
     * {@link AntiBannerFiltersId.TrackingFilterId}.
     */
    [StealthOption.BlockKnownTrackers]: zod.boolean().optional(),
    /**
     * If true application will enable AdGuard URL Tracking filter
     * {@link AntiBannerFiltersId.UrlTrackingFilterId}.
     */
    [StealthOption.StripTrackingParams]: zod.boolean(),
});

/**
 * Contains various secure browsing settings: cookie deletion time, privacy
 * headers, referrer hiding, and the ability to enable additional filters.
 */
export type StealthConfig = zod.infer<typeof stealthConfigValidator>;
