import { FilterTag, SubscriptionFilter, SubscriptionGroup } from './metadata';

/**
 * Metadata factory
 */
export const metadataFactory = (() => {
    /**
     * Parses string to date
     *
     * @param timeUpdatedString String in format 'yyyy-MM-dd'T'HH:mm:ssZ'
     * @returns number from date string
     */
    const parseTimeUpdated = timeUpdatedString => {
        // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/1272
        if (Number.isInteger(timeUpdatedString)) {
            return new Date(timeUpdatedString).getTime();
        }

        // https://developer.mozilla.org/ru/docs/Web/JavaScript/Reference/Global_Objects/Date/parse
        let timeUpdated = Date.parse(timeUpdatedString);
        if (Number.isNaN(timeUpdated)) {
            // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/478
            timeUpdated = Date.parse(timeUpdatedString.replace(/\+(\d{2})(\d{2})$/, '+$1:$2'));
        }
        if (Number.isNaN(timeUpdated)) {
            timeUpdated = new Date().getTime();
        }
        return timeUpdated;
    };

    /**
     * Create tag from object
     *
     * @param tag Object
     * @returns {FilterTag}
     */
    const createFilterTagFromJSON = tag => {
        const tagId = Number.parseInt(tag.tagId, 10);
        const { keyword } = tag;

        return new FilterTag(tagId, keyword);
    };

    /**
     * Create group from object
     *
     * @param group Object
     * @returns {SubscriptionGroup}
     */
    const createSubscriptionGroupFromJSON = group => {
        const groupId = Number.parseInt(group.groupId, 10);
        const defaultGroupName = group.groupName;
        const displayNumber = Number.parseInt(group.displayNumber, 10);

        return new SubscriptionGroup(groupId, defaultGroupName, displayNumber);
    };

    /**
     * Create filter from object
     *
     * @param filter Object
     */
    const createSubscriptionFilterFromJSON = filter => {
        const filterId = Number.parseInt(filter.filterId, 10);
        const groupId = Number.parseInt(filter.groupId, 10);
        const timeUpdated = parseTimeUpdated(filter.timeUpdated);
        const expires = Number.parseInt(filter.expires, 10);
        const displayNumber = Number.parseInt(filter.displayNumber, 10);

        const {
            name, description, homepage, version, subscriptionUrl, languages, tags, customUrl, trusted, checksum,
        } = filter;

        if (tags.length === 0) {
            tags.push(0);
        }

        return new SubscriptionFilter({
            filterId,
            groupId,
            name,
            description,
            homepage,
            version,
            timeUpdated,
            displayNumber,
            languages,
            expires,
            subscriptionUrl,
            tags,
            customUrl,
            trusted,
            checksum,
        });
    };

    return {
        createFilterTagFromJSON,
        createSubscriptionGroupFromJSON,
        createSubscriptionFilterFromJSON,
    };
})();
