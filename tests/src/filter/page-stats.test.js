import { pageStats } from '../../../Extension/src/background/filter/page-stats';
import { subscriptions } from '../../../Extension/src/background/filter/filters/subscription';

jest.mock('../../../Extension/src/background/utils/local-storage', () => {
    const getItem = function (key) {
        return global.localStorage.getItem(key);
    };

    const setItem = function (key, value) {
        global.localStorage.setItem(key, value);
    };

    const removeItem = function (key) {
        global.localStorage.removeItem(key);
    };

    const hasItem = function (key) {
        return key in global.localStorage;
    };

    return {
        __esModule: true,
        localStorageImpl: {
            getItem,
            setItem,
            removeItem,
            hasItem,
        },
    };
});

describe('pageStats', () => {
    const groupsMap = {
        1: { groupId: 1, groupName: 'Ad Blocking', displayNumber: 1 },
        2: { groupId: 2, groupName: 'Privacy', displayNumber: 2 },
        3: { groupId: 3, groupName: 'Social Widgets', displayNumber: 3 },
        4: { groupId: 4, groupName: 'Annoyances', displayNumber: 4 },
        5: { groupId: 5, groupName: 'Security', displayNumber: 5 },
        6: { groupId: 6, groupName: 'Other', displayNumber: 6 },
        7: { groupId: 7, groupName: 'Language-specific', displayNumber: 7 },
        0: { groupId: 0, groupName: 'Custom', displayNumber: 99 },
    };

    jest.spyOn(subscriptions, 'getGroups').mockImplementation(() => {
        return Object.keys(groupsMap).map(key => {
            return groupsMap[key];
        });
    });

    jest.spyOn(subscriptions, 'getGroup').mockImplementation((groupId) => {
        return groupsMap[groupId];
    });

    const filtersMap = {
        1: { filterId: 1, groupId: 1 },
        2: { filterId: 2, groupId: 2 },
        3: { filterId: 3, groupId: 2 },
        4: { filterId: 4, groupId: 3 },
        5: { filterId: 5, groupId: 5 },
    };

    jest.spyOn(subscriptions, 'getFilter').mockImplementation((filterId) => {
        return filtersMap[filterId];
    });

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
     * pageStats.getStatisticsData();
     *      {
            today: stats.data.hours,
            lastWeek: stats.data.days.slice(-7),
            lastMonth: stats.data.days,
            lastYear: stats.data.months.slice(-12),
            overall: stats.data.months,
            blockedGroups: getBlockedGroups(),
        };
     */

    it('Test Page Stats', () => {
        // test that data is empty
        pageStats.resetStats();

        const now = new Date(2019, 0);
        now.setHours(0, 0, 0, 0);

        let data = pageStats.getStatisticsData(now);

        const nonEmptyTodayData = getNonEmptyData(data.today);
        expect(nonEmptyTodayData.length).toBe(0);

        const nonEmptyWeekData = getNonEmptyData(data.lastWeek);
        expect(nonEmptyWeekData.length).toBe(0);

        const nonEmptyMonthData = getNonEmptyData(data.lastMonth);
        expect(nonEmptyMonthData.length).toBe(0);

        const nonEmptyYearData = getNonEmptyData(data.lastYear);
        expect(nonEmptyYearData.length).toBe(0);

        const nonEmptyOverallData = getNonEmptyData(data.overall);
        expect(nonEmptyOverallData.length).toBe(0);

        // test total blocked
        let totalBlocked = pageStats.getTotalBlocked();
        expect(totalBlocked).toBe(0);
        pageStats.updateTotalBlocked(24);
        totalBlocked = pageStats.getTotalBlocked();
        expect(totalBlocked).toBe(24);

        // test adding first filter data
        const firstFilter = subscriptions.getFilter(1);
        pageStats.updateStats(firstFilter.filterId, 10, now);
        data = pageStats.getStatisticsData();
        expect(data).toBeTruthy();
        expect(data.today.length).toBe(24);
        expect(getLastData(data.today)[firstFilter.groupId]).toBe(10);
        expect(getLastData(data.today).total).toBe(10);

        expect(data.lastMonth.length).toBe(30);
        expect(getLastData(data.lastMonth)[firstFilter.groupId]).toBe(10);
        expect(getLastData(data.lastMonth).total).toBe(10);

        expect(data.lastWeek.length).toBe(7);
        expect(data.overall.length).toBe(3);
        expect(getLastData(data.overall)[firstFilter.groupId]).toBe(10);
        expect(getLastData(data.overall).total).toBe(10);
        expect(data.lastYear.length).toBe(3);

        // Test adding second filter data
        const secondFilter = subscriptions.getFilter(2);
        pageStats.updateStats(secondFilter.filterId, 100, now);
        data = pageStats.getStatisticsData();
        expect(data);

        expect(data.today.length).toBe(24);
        expect(getLastData(data.today)[firstFilter.groupId]).toBe(10);
        expect(getLastData(data.today)[secondFilter.groupId]).toBe(100);
        expect(getLastData(data.today).total).toBe(110);

        expect(data.lastMonth.length).toBe(30);
        expect(getLastData(data.lastMonth)[firstFilter.groupId]).toBe(10);
        expect(getLastData(data.lastMonth)[secondFilter.groupId]).toBe(100);
        expect(getLastData(data.lastMonth).total).toBe(110);

        expect(data.lastWeek.length).toBe(7);
        expect(data.overall.length).toBe(3);
        expect(getLastData(data.overall)[firstFilter.groupId]).toBe(10);
        expect(getLastData(data.overall)[secondFilter.groupId]).toBe(100);
        expect(getLastData(data.overall).total).toBe(110);
        expect(data.lastYear.length).toBe(3);

        // Test that filter data correctly sums
        pageStats.updateStats(firstFilter.filterId, 10, now);
        data = pageStats.getStatisticsData();
        expect(data).toBeTruthy();
        expect(data.today.length).toBe(24);
        expect(getLastData(data.today)[firstFilter.groupId]).toBe(20);
        expect(getLastData(data.today)[secondFilter.groupId]).toBe(100);
        expect(getLastData(data.today).total).toBe(120);

        expect(data.lastMonth.length).toBe(30);
        expect(getLastData(data.lastMonth)[firstFilter.groupId]).toBe(20);
        expect(getLastData(data.lastMonth)[secondFilter.groupId]).toBe(100);
        expect(getLastData(data.lastMonth).total).toBe(120);

        expect(data.lastWeek.length).toBe(7);
        expect(data.overall.length).toBe(3);
        expect(getLastData(data.overall)[firstFilter.groupId]).toBe(20);
        expect(getLastData(data.overall)[secondFilter.groupId]).toBe(100);
        expect(getLastData(data.overall).total).toBe(120);
        expect(data.lastYear.length).toBe(3);

        // Test data is correctly added after 3 hours passed
        const fourthFilter = subscriptions.getFilter(4);
        const hoursShift = 3;
        const hoursShiftTime = new Date(now.getTime() + (hoursShift * 60 * 60 * 1000));
        pageStats.updateStats(fourthFilter.filterId, 1000, hoursShiftTime);
        data = pageStats.getStatisticsData();
        expect(data).toBeTruthy();
        expect(data.today.length).toBe(24);
        expect(getLastData(data.today, hoursShift)[firstFilter.groupId]).toBe(20);
        expect(getLastData(data.today, hoursShift)[secondFilter.groupId]).toBe(100);
        expect(getLastData(data.today, hoursShift).total).toBe(120);
        expect(getLastData(data.today)[fourthFilter.groupId]).toBe(1000);
        expect(getLastData(data.today).total).toBe(1000);
        expect(data.lastMonth.length).toBe(30);
        expect(getLastData(data.lastMonth)[firstFilter.groupId]).toBe(20);
        expect(getLastData(data.lastMonth)[secondFilter.groupId]).toBe(100);
        expect(getLastData(data.lastMonth)[fourthFilter.groupId]).toBe(1000);
        expect(getLastData(data.lastMonth).total).toBe(1120);
        expect(data.lastWeek.length).toBe(7);
        expect(data.overall.length).toBe(3);
        expect(getLastData(data.overall)[firstFilter.groupId]).toBe(20);
        expect(getLastData(data.overall)[secondFilter.groupId]).toBe(100);
        expect(getLastData(data.overall)[fourthFilter.groupId]).toBe(1000);
        expect(getLastData(data.overall).total).toBe(1120);
        expect(data.lastYear.length).toBe(3);

        // Test data is correctly added after 4 days passed
        const fifthFilter = subscriptions.getFilter(5);
        const daysShift = 4;
        const daysShiftTime = new Date(hoursShiftTime.getTime() + (daysShift * 24 * 60 * 60 * 1000));
        pageStats.updateStats(fifthFilter.filterId, 10000, daysShiftTime);
        data = pageStats.getStatisticsData();
        expect(data).toBeTruthy();
        expect(data.today.length).toBe(24);
        expect(getLastData(data.today)[fifthFilter.groupId]).toBe(10000);
        expect(getLastData(data.today).total).toBe(10000);
        expect(data.lastMonth.length).toBe(30);
        expect(getLastData(data.lastMonth, daysShift)[firstFilter.groupId]).toBe(20);
        expect(getLastData(data.lastMonth, daysShift)[secondFilter.groupId]).toBe(100);
        expect(getLastData(data.lastMonth, daysShift)[fourthFilter.groupId]).toBe(1000);
        expect(getLastData(data.lastMonth, daysShift).total).toBe(1120);
        expect(getLastData(data.lastMonth)[fifthFilter.filterId]).toBe(10000);
        expect(getLastData(data.lastMonth).total).toBe(10000);
        expect(data.lastWeek.length).toBe(7);
        expect(data.overall.length).toBe(3);
        expect(getLastData(data.overall)[firstFilter.groupId]).toBe(20);
        expect(getLastData(data.overall)[secondFilter.groupId]).toBe(100);
        expect(getLastData(data.overall)[fourthFilter.groupId]).toBe(1000);
        expect(getLastData(data.overall)[fifthFilter.groupId]).toBe(10000);
        expect(getLastData(data.overall).total).toBe(11120);
        expect(data.lastYear.length).toBe(3);

        // Test data is correctly added after 4 months passed
        const monthsShift = 2;
        const monthsShiftTime = new Date(daysShiftTime.getTime() + (monthsShift * 30 * 24 * 60 * 60 * 1000));
        pageStats.updateStats(secondFilter.filterId, 200, monthsShiftTime);
        data = pageStats.getStatisticsData();
        expect(data).toBeTruthy();
        expect(data.today.length).toBe(24);
        expect(getLastData(data.today)[secondFilter.groupId]).toBe(200);
        expect(getLastData(data.today).total).toBe(200);
        expect(data.lastMonth.length).toBe(30);
        expect(getLastData(data.lastMonth)[secondFilter.groupId]).toBe(200);
        expect(getLastData(data.lastMonth).total).toBe(200);
        expect(data.lastWeek.length).toBe(7);
        expect(data.overall.length).toBe(3 + monthsShift);
        expect(getLastData(data.overall, monthsShift)[firstFilter.groupId]).toBe(20);
        expect(getLastData(data.overall, monthsShift)[secondFilter.groupId]).toBe(100);
        expect(getLastData(data.overall, monthsShift)[fourthFilter.groupId]).toBe(1000);
        expect(getLastData(data.overall)[secondFilter.groupId]).toBe(200);
        expect(getLastData(data.overall).total).toBe(200);
        expect(data.lastYear.length).toBe(3 + monthsShift);
    });
});
