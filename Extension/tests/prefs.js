exports.Prefs = {};
exports.Prefs.getBrowser = function () {
    return null;
};
exports.Prefs.getLocalFilterPath = function (filterId) {
    var url = "filter_" + filterId + ".txt";
    return '../filters/' + url;
};