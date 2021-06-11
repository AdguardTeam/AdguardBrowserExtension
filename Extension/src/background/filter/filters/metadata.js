export const metadata = (() => {
    /**
     * object containing filter data
     * @typedef {Object} FilterData
     * @property {number} filterId - filter id
     * @property {number} groupId - filter group id
     * @property {String} name - filter name
     * @property {String} description - filter description
     * @property {String} homepage - filter homepage url
     * @property {String} version - filter version
     * @property {number} timeUpdated - filter update time
     * @property {number} displayNumber - filter display number used to sort filters in the group
     * @property {array.<string>} languages - filter base languages
     * @property {number} expires - filter update interval
     * @property {String} subscriptionUrl - filter update url
     * @property {array.<number>} tags - filter tags ids
     * @property {String} [customUrl] - custom filter url
     * @property {Boolean} [trusted] - filter is trusted or not
     */

    /**
     * Filter metadata
     * @param {FilterData} filterData
     */
    const SubscriptionFilter = function (filterData) {
        const {
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
        } = filterData;

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
    };

    /**
     * Tag metadata
     */
    const FilterTag = function (tagId, keyword) {
        this.tagId = tagId;
        this.keyword = keyword;
    };

    /**
     * Group metadata
     */
    const SubscriptionGroup = function (groupId, groupName, displayNumber) {
        this.groupId = groupId;
        this.groupName = groupName;
        this.displayNumber = displayNumber;
    };

    return {
        SubscriptionFilter,
        SubscriptionGroup,
        FilterTag,
    };
})();
