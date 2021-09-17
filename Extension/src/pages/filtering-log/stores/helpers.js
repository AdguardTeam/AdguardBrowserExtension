import { containsIgnoreCase } from '../../helpers';

export const matchesSearch = (filteringEvent, search) => {
    let matches = !search
    || containsIgnoreCase(filteringEvent.requestUrl, search)
    || containsIgnoreCase(filteringEvent.element, search)
    || containsIgnoreCase(filteringEvent.cookieName, search)
    || containsIgnoreCase(filteringEvent.cookieValue, search);

    const { ruleText, filterName } = filteringEvent;
    if (ruleText) {
        matches = matches || containsIgnoreCase(ruleText, search);
    }

    if (filterName) {
        matches = matches
            || containsIgnoreCase(filterName, search);
    }

    return matches;
};
