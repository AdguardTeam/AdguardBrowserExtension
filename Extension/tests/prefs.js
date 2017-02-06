adguard.prefs.getBrowser = function () {
    return null;
};
adguard.prefs.getLocalFilterPath = function (filterId) {
    var url = "filter_" + filterId + ".txt";
    return '../filters/' + url;
};