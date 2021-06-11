import { FilterTag, SubscriptionFilter, SubscriptionGroup } from './metadata';

/**
 * Metadata factory
 */
export const metadataFactory = (() => {
    /**
     * Parses string to date
     *
     * @param timeUpdatedString String in format 'yyyy-MM-dd'T'HH:mm:ssZ'
     * @returns timestamp from date string
     */
    const parseTimeUpdated = timeUpdatedString => {
        // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/1272
        if (Number.isInteger(timeUpdatedString)) {
            return new Date(timeUpdatedString);
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
        const tagId = tag.tagId - 0;
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
        const groupId = group.groupId - 0;
        const defaultGroupName = group.groupName;
        const displayNumber = group.displayNumber - 0;

        return new SubscriptionGroup(groupId, defaultGroupName, displayNumber);
    };

    /**
     * Create filter from object
     *
     * @param filter Object
     */
    const createSubscriptionFilterFromJSON = (filter) => {
        const filterId = filter.filterId - 0;
        const groupId = filter.groupId - 0;
        const defaultName = filter.name;
        const defaultDescription = filter.description;
        const { homepage } = filter;
        const { version } = filter;
        const timeUpdated = parseTimeUpdated(filter.timeUpdated);
        const expires = filter.expires - 0;
        const { subscriptionUrl } = filter;
        const { languages } = filter;
        const displayNumber = filter.displayNumber - 0;
        const { tags } = filter;
        const { customUrl } = filter;
        const { trusted } = filter;
        const { checksum } = filter;
        if (tags.length === 0) {
            tags.push(0);
        }

        return new SubscriptionFilter({
            filterId,
            groupId,
            name: defaultName,
            description: defaultDescription,
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
