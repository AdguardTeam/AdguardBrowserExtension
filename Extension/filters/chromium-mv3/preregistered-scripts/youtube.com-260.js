(function () {
var _g = window._g;
if (!_g) return;
_g.r("json-prune", {"name":"json-prune","args":["$..adaptiveFormats.*[?.audioTrack.isAutoDubbed]"],"engine":"extension","version":"2.4.2","verbose":false}, ["$..adaptiveFormats.*[?.audioTrack.isAutoDubbed]"], "7ef2372ee89be8dcc1fd10f4d0b15385");
_g.r("ubo-json-prune", {"name":"ubo-json-prune","args":["$[?..paygatedQualitiesMetadata.*[?.key==\"1080p\"]]..adaptiveFormats.*[?.qualityLabel==\"1080p\"]"],"engine":"extension","version":"2.4.2","verbose":false}, ["$[?..paygatedQualitiesMetadata.*[?.key==\"1080p\"]]..adaptiveFormats.*[?.qualityLabel==\"1080p\"]"], "9afdbcce91ac7761bbc901f31ce56b46");
_g.r("ubo-json-prune", {"name":"ubo-json-prune","args":["$[?..paygatedQualitiesMetadata.*[?.key==\"720p\"]]..adaptiveFormats.*[?.qualityLabel==\"720p\"]"],"engine":"extension","version":"2.4.2","verbose":false}, ["$[?..paygatedQualitiesMetadata.*[?.key==\"720p\"]]..adaptiveFormats.*[?.qualityLabel==\"720p\"]"], "e676b6c23b3cb2a2f0c25b3d5d622b48");
})();
