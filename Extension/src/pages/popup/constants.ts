import { Forward, ForwardAction, ForwardFrom } from '../../common/forward';

export const IOS_URL = Forward.get({
    action: ForwardAction.IOS,
    from: ForwardFrom.Popup,
});

export const ANDROID_URL = Forward.get({
    action: ForwardAction.Android,
    from: ForwardFrom.Popup,
});

export const COMPARE_URL = Forward.get({
    action: ForwardAction.Compare,
    from: ForwardFrom.Popup,
});

export const VIEW_STATES = {
    ACTIONS: 'actions',
    STATS: 'stats',
};

export const POPUP_STATES = {
    APPLICATION_ENABLED: 'application.enabled',
    APPLICATION_FILTERING_DISABLED: 'application.filtering.disabled',
    APPLICATION_UNAVAILABLE: 'application.unavailable',
    SITE_IN_EXCEPTION: 'site.in.exception',
    SITE_ALLOWLISTED: 'site.allowlisted',
};

export const TIME_RANGES = {
    DAY: 'day',
    WEEK: 'week',
    MONTH: 'month',
    YEAR: 'year',
};
