import { ForwardAction, ForwardFrom, Forward } from '../../common/forward';

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
