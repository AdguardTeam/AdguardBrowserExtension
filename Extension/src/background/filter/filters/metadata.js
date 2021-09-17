/* eslint-disable max-classes-per-file */
/**
 * Filter metadata
 */
export class SubscriptionFilter {
    constructor({
        filterId,
        groupId,
        name,
        description,
        homepage,
        version,
        timeUpdated,
        displayNumber = 0,
        languages = [],
        expires,
        subscriptionUrl,
        tags,
        customUrl,
        trusted,
        checksum,
    }) {
        this.filterId = filterId;
        this.groupId = groupId;
        this.name = name;
        this.description = description;
        this.homepage = homepage;
        this.version = version;
        this.timeUpdated = timeUpdated;
        this.displayNumber = displayNumber;
        this.languages = languages;
        this.expires = expires;
        this.subscriptionUrl = subscriptionUrl;
        this.tags = tags;
        // Custom filters data
        if (typeof customUrl !== 'undefined') {
            this.customUrl = customUrl;
        }
        if (typeof trusted !== 'undefined') {
            this.trusted = trusted;
        }
        if (typeof checksum !== 'undefined') {
            this.checksum = checksum;
        }
    }
}

/**
 * Group metadata
 */
export class SubscriptionGroup {
    constructor(groupId, groupName, displayNumber) {
        this.groupId = groupId;
        this.groupName = groupName;
        this.displayNumber = displayNumber;
    }
}

/**
 * Tag metadata
 */
export class FilterTag {
    constructor(tagId, keyword) {
        this.tagId = tagId;
        this.keyword = keyword;
    }
}
