adguard.subscriptions = {};

const groupsMap = {
    1: {groupId: 1, groupName: "Ad Blocking", displayNumber: 1},
    2: {groupId: 2, groupName: "Privacy", displayNumber: 2},
    3: {groupId: 3, groupName: "Social Widgets", displayNumber: 3},
    4: {groupId: 4, groupName: "Annoyances", displayNumber: 4},
    5: {groupId: 5, groupName: "Security", displayNumber: 5},
    6: {groupId: 6, groupName: "Other", displayNumber: 6},
    7: {groupId: 7, groupName: "Language-specific", displayNumber: 7},
    0: {groupId: 0, groupName: "Custom", displayNumber: 99},
};

adguard.subscriptions.getGroups = () => Object.keys(groupsMap).map(key => {
        return groupsMap[key];
    });

adguard.subscriptions.getGroup = (groupId) => {
    return groupsMap[groupId];
};

const filtersMap = {
    1: {filterId: 1, groupId: 1},
    2: {filterId: 2, groupId: 2},
    3: {filterId: 3, groupId: 2},
    4: {filterId: 4, groupId: 3},
    5: {filterId: 5, groupId: 5},
};

adguard.subscriptions.getFilter = (filterId) => {
    return filtersMap[filterId];
};

/**
 * removes from array total data equal to 0
 * @param {Array.<{total: number}>} arr
 */
const getNonEmptyData = (arr) => {
    return arr.filter(m => m.total !== 0);
};

const getLastData = (arr, shift = 0) => {
    return arr[arr.length - (shift + 1)];
};

/**
 * adguard.pageStats.getStatisticsData();
 *      {
            today: stats.data.hours,
            lastWeek: stats.data.days.slice(-7),
            lastMonth: stats.data.days,
            lastYear: stats.data.months.slice(-12),
            overall: stats.data.months,
            blockedGroups: getBlockedGroups(),
        };
 */

QUnit.test("Test Page Stats", function (assert) {
    var done = assert.async();

    adguard.localStorage.init(function () {
        // test that data is empty
        adguard.pageStats.resetStats();
        let data = adguard.pageStats.getStatisticsData();

        const nonEmptyTodayData = getNonEmptyData(data.today);
        assert.equal(nonEmptyTodayData.length, 0);

        const nonEmptyWeekData = getNonEmptyData(data.lastWeek);
        assert.equal(nonEmptyWeekData.length, 0);

        const nonEmptyMonthData = getNonEmptyData(data.lastMonth);
        assert.equal(nonEmptyMonthData.length, 0);

        const nonEmptyYearData = getNonEmptyData(data.lastYear);
        assert.equal(nonEmptyYearData.length, 0);

        const nonEmptyOverallData = getNonEmptyData(data.overall);
        assert.equal(nonEmptyOverallData.length, 0);

        // test total blocked
        let totalBlocked = adguard.pageStats.getTotalBlocked();
        assert.equal(totalBlocked, 0);
        adguard.pageStats.updateTotalBlocked(24);
        totalBlocked = adguard.pageStats.getTotalBlocked();
        assert.equal(totalBlocked, 24);

        const now = new Date();
        now.setHours(0, 0, 0, 0);

        // test adding first filter data
        const firstFilter = adguard.subscriptions.getFilter(1);
        adguard.pageStats.updateStats(firstFilter.filterId, 10, now);
        data = adguard.pageStats.getStatisticsData();
        assert.ok(data);
        assert.equal(data.today.length, 24);
        assert.equal(getLastData(data.today)[firstFilter.groupId], 10);
        assert.equal(getLastData(data.today).total, 10);

        assert.equal(data.lastMonth.length, 30);
        assert.equal(getLastData(data.lastMonth)[firstFilter.groupId], 10);
        assert.equal(getLastData(data.lastMonth).total, 10);

        assert.equal(data.lastWeek.length, 7);
        assert.equal(data.overall.length, 3);
        assert.equal(getLastData(data.overall)[firstFilter.groupId], 10);
        assert.equal(getLastData(data.overall).total, 10);
        assert.equal(data.lastYear.length, 3);

        // Test adding second filter data
        const secondFilter = adguard.subscriptions.getFilter(2);
        adguard.pageStats.updateStats(secondFilter.filterId, 100, now);
        data = adguard.pageStats.getStatisticsData();
        assert.ok(data);

        assert.equal(data.today.length, 24);
        assert.equal(getLastData(data.today)[firstFilter.groupId], 10);
        assert.equal(getLastData(data.today)[secondFilter.groupId], 100);
        assert.equal(getLastData(data.today).total, 110);

        assert.equal(data.lastMonth.length, 30);
        assert.equal(getLastData(data.lastMonth)[firstFilter.groupId], 10);
        assert.equal(getLastData(data.lastMonth)[secondFilter.groupId], 100);
        assert.equal(getLastData(data.lastMonth).total, 110);

        assert.equal(data.lastWeek.length, 7);
        assert.equal(data.overall.length, 3);
        assert.equal(getLastData(data.overall)[firstFilter.groupId], 10);
        assert.equal(getLastData(data.overall)[secondFilter.groupId], 100);
        assert.equal(getLastData(data.overall).total, 110);
        assert.equal(data.lastYear.length, 3);

        // Test that filter data correctly sums
        adguard.pageStats.updateStats(firstFilter.filterId, 10, now);
        data = adguard.pageStats.getStatisticsData();
        assert.ok(data);
        assert.equal(data.today.length, 24);
        assert.equal(getLastData(data.today)[firstFilter.groupId], 20);
        assert.equal(getLastData(data.today)[secondFilter.groupId], 100);
        assert.equal(getLastData(data.today).total, 120);

        assert.equal(data.lastMonth.length, 30);
        assert.equal(getLastData(data.lastMonth)[firstFilter.groupId], 20);
        assert.equal(getLastData(data.lastMonth)[secondFilter.groupId], 100);
        assert.equal(getLastData(data.lastMonth).total, 120);

        assert.equal(data.lastWeek.length, 7);
        assert.equal(data.overall.length, 3);
        assert.equal(getLastData(data.overall)[firstFilter.groupId], 20);
        assert.equal(getLastData(data.overall)[secondFilter.groupId], 100);
        assert.equal(getLastData(data.overall).total, 120);
        assert.equal(data.lastYear.length, 3);

        // Test data is correctly added after 3 hours passed
        const fourthFilter = adguard.subscriptions.getFilter(4);
        const hoursShift = 3;
        const hoursShiftTime = new Date(now.getTime() + (hoursShift * 60 * 60 * 1000));
        adguard.pageStats.updateStats(fourthFilter.filterId, 1000, hoursShiftTime);
        data = adguard.pageStats.getStatisticsData();
        assert.ok(data);
        assert.equal(data.today.length, 24);
        assert.equal(getLastData(data.today, hoursShift)[firstFilter.groupId], 20);
        assert.equal(getLastData(data.today, hoursShift)[secondFilter.groupId], 100);
        assert.equal(getLastData(data.today, hoursShift).total, 120);
        assert.equal(getLastData(data.today)[fourthFilter.groupId], 1000);
        assert.equal(getLastData(data.today).total, 1000);
        assert.equal(data.lastMonth.length, 30);
        assert.equal(getLastData(data.lastMonth)[firstFilter.groupId], 20);
        assert.equal(getLastData(data.lastMonth)[secondFilter.groupId], 100);
        assert.equal(getLastData(data.lastMonth)[fourthFilter.groupId], 1000);
        assert.equal(getLastData(data.lastMonth).total, 1120);
        assert.equal(data.lastWeek.length, 7);
        assert.equal(data.overall.length, 3);
        assert.equal(getLastData(data.overall)[firstFilter.groupId], 20);
        assert.equal(getLastData(data.overall)[secondFilter.groupId], 100);
        assert.equal(getLastData(data.overall)[fourthFilter.groupId], 1000);
        assert.equal(getLastData(data.overall).total, 1120);
        assert.equal(data.lastYear.length, 3);

        // Test data is correctly added after 4 days passed
        const fifthFilter = adguard.subscriptions.getFilter(5);
        const daysShift = 4;
        const daysShiftTime = new Date(hoursShiftTime.getTime() + (daysShift * 24 * 60 * 60 * 1000));
        adguard.pageStats.updateStats(fifthFilter.filterId, 10000, daysShiftTime);
        data = adguard.pageStats.getStatisticsData();
        assert.ok(data);
        assert.equal(data.today.length, 24);
        assert.equal(getLastData(data.today)[fifthFilter.groupId], 10000);
        assert.equal(getLastData(data.today).total, 10000);
        assert.equal(data.lastMonth.length, 30);
        assert.equal(getLastData(data.lastMonth, daysShift)[firstFilter.groupId], 20);
        assert.equal(getLastData(data.lastMonth, daysShift)[secondFilter.groupId], 100);
        assert.equal(getLastData(data.lastMonth, daysShift)[fourthFilter.groupId], 1000);
        assert.equal(getLastData(data.lastMonth, daysShift).total, 1120);
        assert.equal(getLastData(data.lastMonth)[fifthFilter.filterId], 10000);
        assert.equal(getLastData(data.lastMonth).total, 10000);
        assert.equal(data.lastWeek.length, 7);
        assert.equal(data.overall.length, 3);
        assert.equal(getLastData(data.overall)[firstFilter.groupId], 20);
        assert.equal(getLastData(data.overall)[secondFilter.groupId], 100);
        assert.equal(getLastData(data.overall)[fourthFilter.groupId], 1000);
        assert.equal(getLastData(data.overall)[fifthFilter.groupId], 10000);
        assert.equal(getLastData(data.overall).total, 11120);
        assert.equal(data.lastYear.length, 3);

        // Test data is correctly added after 4 months passed
        const monthsShift = 2;
        const monthsShiftTime = new Date(daysShiftTime.getTime() + (monthsShift * 30 * 24 * 60 * 60 * 1000));
        adguard.pageStats.updateStats(secondFilter.filterId, 200, monthsShiftTime);
        data = adguard.pageStats.getStatisticsData();
        assert.ok(data);
        assert.equal(data.today.length, 24);
        assert.equal(getLastData(data.today)[secondFilter.groupId], 200);
        assert.equal(getLastData(data.today).total, 200);
        assert.equal(data.lastMonth.length, 30);
        assert.equal(getLastData(data.lastMonth)[secondFilter.groupId], 200);
        assert.equal(getLastData(data.lastMonth).total, 200);
        assert.equal(data.lastWeek.length, 7);
        assert.equal(data.overall.length, 3 + monthsShift);
        assert.equal(getLastData(data.overall, monthsShift)[firstFilter.groupId], 20);
        assert.equal(getLastData(data.overall, monthsShift)[secondFilter.groupId], 100);
        assert.equal(getLastData(data.overall, monthsShift)[fourthFilter.groupId], 1000);
        assert.equal(getLastData(data.overall)[secondFilter.groupId], 200);
        assert.equal(getLastData(data.overall).total, 200);
        assert.equal(data.lastYear.length, 3 + monthsShift);

        done();
    });
});
