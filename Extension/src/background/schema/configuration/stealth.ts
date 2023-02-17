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
import zod from 'zod';

// Stealth configuration

export const enum StealthOption {
    DisableStealthMode = 'stealth_disable_stealth_mode',
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
    [StealthOption.DisableStealthMode]: zod.boolean(),
    [StealthOption.HideReferrer]: zod.boolean(),
    [StealthOption.HideSearchQueries]: zod.boolean(),
    [StealthOption.SendDoNotTrack]: zod.boolean(),
    [StealthOption.BlockWebRTC]: zod.boolean(),
    [StealthOption.RemoveXClientData]: zod.boolean(),
    [StealthOption.SelfDestructThirdPartyCookies]: zod.boolean(),
    [StealthOption.SelfDestructThirdPartyCookiesTime]: zod.number().int().optional(),
    [StealthOption.SelfDestructFirstPartyCookies]: zod.boolean(),
    [StealthOption.SelfDestructFirstPartyCookiesTime]: zod.number().int().optional(),
    [StealthOption.BlockKnownTrackers]: zod.boolean().optional(),
    [StealthOption.StripTrackingParams]: zod.boolean(),
});

export type StealthConfig = zod.infer<typeof stealthConfigValidator>;
