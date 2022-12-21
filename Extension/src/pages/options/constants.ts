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

import {
    ForwardAction,
    ForwardFrom,
    Forward,
} from '../../common/forward';

export const PRIVACY_URL = Forward.get({
    action: ForwardAction.Privacy,
    from: ForwardFrom.Options,
});

export const ACKNOWLEDGMENTS_URL = Forward.get({
    action: ForwardAction.Acknowledgments,
    from: ForwardFrom.Options,
});

export const GITHUB_URL = Forward.get({
    action: ForwardAction.Github,
    from: ForwardFrom.Options,
});

export const WEBSITE_URL = Forward.get({
    action: ForwardAction.Website,
    from: ForwardFrom.OptionsFooter,
});

export const DISCUSS_URL = Forward.get({
    action: ForwardAction.Discuss,
    from: ForwardFrom.Options,
});

export const COMPARE_URL = Forward.get({
    action: ForwardAction.Compare,
    from: ForwardFrom.Options,
});

export const CHANGELOG_URL = Forward.get({
    action: ForwardAction.Changelog,
    from: ForwardFrom.Options,
});

export const GLOBAL_PRIVACY_CONTROL_URL = Forward.get({
    action: ForwardAction.GlobalPrivacyControl,
    from: ForwardFrom.Options,
});

export const DO_NOT_TRACK_URL = Forward.get({
    action: ForwardAction.DoNotTrack,
    from: ForwardFrom.Options,
});

export const HOW_TO_CREATE_RULES_URL = Forward.get({
    action: ForwardAction.HowToCreateRules,
    from: ForwardFrom.Options,
});

export const ACCEPTABLE_ADS_LEARN_MORE_URL = Forward.get({
    action: ForwardAction.SelfPromotion,
    from: ForwardFrom.Options,
});

export const SAFEBROWSING_LEARN_MORE_URL = Forward.get({
    action: ForwardAction.ProtectionWorks,
    from: ForwardFrom.Options,
});

export const COLLECT_HITS_LEARN_MORE_URL = Forward.get({
    action: ForwardAction.CollectHitsLearnMore,
    from: ForwardFrom.Options,
});
