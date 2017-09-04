adguard.tags = {};

adguard.tags.getPurposeGroupedFilters = function () {
    var adsFilters = [{filterId: 1}, {filterId: 2}];
    var socialFilters = [{filterId: 1}, {filterId: 3}, {filterId: 4}];
    var privacyFilters = [{filterId: 1}, {filterId: 5}, {filterId: 6}];
    var annoyancesFilters = [{filterId: 7}, {filterId: 8}];
    var cookiesFilters = [{filterId: 8}, {filterId: 10}];
    var securityFilters = [{filterId: 9}, {filterId: 12}];

    return {
        ads: adsFilters,
        social: socialFilters,
        privacy: privacyFilters,
        security: securityFilters,
        annoyances: annoyancesFilters,
        cookies: cookiesFilters
    };
};

QUnit.test("Test Page Stats", function (assert) {
    var done = assert.async();

    adguard.localStorage.init(function () {
        adguard.pageStats.resetStats();
        var data = adguard.pageStats.getStatisticsData();
        assert.notOk(data);

        var totalBlocked = adguard.pageStats.getTotalBlocked();
        assert.equal(totalBlocked, 0);
        adguard.pageStats.updateTotalBlocked(24);
        totalBlocked = adguard.pageStats.getTotalBlocked();
        assert.equal(totalBlocked, 24);

        var now = new Date();

        adguard.pageStats.updateStats(1, 10, now);
        data = adguard.pageStats.getStatisticsData();
        assert.ok(data);
        assert.equal(data.today.length, 24);
        assert.equal(data.today[data.today.length - 1][14], 10);
        assert.equal(data.today[data.today.length - 1].total, 10);
        assert.equal(data.lastMonth.length, 30);
        assert.equal(data.lastMonth[data.lastMonth.length - 1][14], 10);
        assert.equal(data.lastMonth[data.lastMonth.length - 1].total, 10);
        assert.equal(data.lastWeek.length, 7);
        assert.equal(data.overall.length, 1);
        assert.equal(data.overall[data.overall.length - 1][14], 10);
        assert.equal(data.overall[data.overall.length - 1].total, 10);
        assert.equal(data.lastYear.length, 1);

        adguard.pageStats.updateStats(2, 100, now);
        data = adguard.pageStats.getStatisticsData();
        assert.ok(data);
        assert.equal(data.today.length, 24);
        assert.equal(data.today[data.today.length - 1][14], 10);
        assert.equal(data.today[data.today.length - 1][2], 100);
        assert.equal(data.today[data.today.length - 1].total, 110);
        assert.equal(data.lastMonth.length, 30);
        assert.equal(data.lastMonth[data.lastMonth.length - 1][14], 10);
        assert.equal(data.lastMonth[data.lastMonth.length - 1][2], 100);
        assert.equal(data.lastMonth[data.lastMonth.length - 1].total, 110);
        assert.equal(data.lastWeek.length, 7);
        assert.equal(data.overall.length, 1);
        assert.equal(data.overall[data.overall.length - 1][14], 10);
        assert.equal(data.overall[data.overall.length - 1][2], 100);
        assert.equal(data.overall[data.overall.length - 1].total, 110);
        assert.equal(data.lastYear.length, 1);


        adguard.pageStats.updateStats(5, 1000, now);
        data = adguard.pageStats.getStatisticsData();
        assert.ok(data);
        assert.equal(data.today.length, 24);
        assert.equal(data.today[data.today.length - 1][14], 10);
        assert.equal(data.today[data.today.length - 1][2], 100);
        assert.equal(data.today[data.today.length - 1][4], 1000);
        assert.equal(data.today[data.today.length - 1].total, 1110);
        assert.equal(data.lastMonth.length, 30);
        assert.equal(data.lastMonth[data.lastMonth.length - 1][14], 10);
        assert.equal(data.lastMonth[data.lastMonth.length - 1][2], 100);
        assert.equal(data.lastMonth[data.lastMonth.length - 1][4], 1000);
        assert.equal(data.lastMonth[data.lastMonth.length - 1].total, 1110);
        assert.equal(data.lastWeek.length, 7);
        assert.equal(data.overall.length, 1);
        assert.equal(data.overall[data.overall.length - 1][14], 10);
        assert.equal(data.overall[data.overall.length - 1][2], 100);
        assert.equal(data.overall[data.overall.length - 1][4], 1000);
        assert.equal(data.overall[data.overall.length - 1].total, 1110);
        assert.equal(data.lastYear.length, 1);


        adguard.pageStats.updateStats(5, 10000, new Date(now.getTime() + (3 * 60 * 60 * 1000)));
        data = adguard.pageStats.getStatisticsData();
        assert.ok(data);
        assert.equal(data.today.length, 24);
        assert.equal(data.today[data.today.length - 4][14], 10);
        assert.equal(data.today[data.today.length - 4][2], 100);
        assert.equal(data.today[data.today.length - 4][4], 1000);
        assert.equal(data.today[data.today.length - 4].total, 1110);
        assert.equal(data.today[data.today.length - 1][4], 10000);
        assert.equal(data.today[data.today.length - 1].total, 10000);
        assert.equal(data.lastMonth.length, 30);
        assert.equal(data.lastMonth[data.lastMonth.length - 1][14], 10);
        assert.equal(data.lastMonth[data.lastMonth.length - 1][2], 100);
        assert.equal(data.lastMonth[data.lastMonth.length - 1][4], 11000);
        assert.equal(data.lastMonth[data.lastMonth.length - 1].total, 11110);
        assert.equal(data.lastWeek.length, 7);
        assert.equal(data.overall.length, 1);
        assert.equal(data.overall[data.overall.length - 1][14], 10);
        assert.equal(data.overall[data.overall.length - 1][2], 100);
        assert.equal(data.overall[data.overall.length - 1][4], 11000);
        assert.equal(data.overall[data.overall.length - 1].total, 11110);
        assert.equal(data.lastYear.length, 1);

        adguard.pageStats.updateStats(5, 10000, new Date(now.getTime() + (2 * 24 * 60 * 60 * 1000)));
        data = adguard.pageStats.getStatisticsData();
        assert.ok(data);
        assert.equal(data.today.length, 24);
        assert.equal(data.today[data.today.length - 1][4], 10000);
        assert.equal(data.today[data.today.length - 1].total, 10000);
        assert.equal(data.lastMonth.length, 30);
        assert.equal(data.lastMonth[data.lastMonth.length - 3][14], 10);
        assert.equal(data.lastMonth[data.lastMonth.length - 3][2], 100);
        assert.equal(data.lastMonth[data.lastMonth.length - 3][4], 11000);
        assert.equal(data.lastMonth[data.lastMonth.length - 3].total, 11110);
        assert.equal(data.lastMonth[data.lastMonth.length - 1][4], 10000);
        assert.equal(data.lastMonth[data.lastMonth.length - 1].total, 10000);
        assert.equal(data.lastWeek.length, 7);
        assert.equal(data.overall.length, 1);
        assert.equal(data.overall[data.overall.length - 1][14], 10);
        assert.equal(data.overall[data.overall.length - 1][2], 100);
        assert.equal(data.overall[data.overall.length - 1][4], 21000);
        assert.equal(data.overall[data.overall.length - 1].total, 21110);
        assert.equal(data.lastYear.length, 1);

        done();
    });
});