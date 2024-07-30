/**
 * @file Test script.
 */

const fs = require('fs');

const fullDb = require('./trackers.json');

// clean up the data so trackers object in fullDb has only categoryId property

const trackersKeys = Object.keys(fullDb.trackers);

const cleanedTrackers = trackersKeys.reduce((acc, key) => {
    const tracker = fullDb.trackers[key];
    const categoryId = tracker.categoryId;
    acc[key] = { categoryId };
    return acc;
}, {});

const newFullDb = {
    ...fullDb,
    trackers: cleanedTrackers,
};

fs.writeFileSync('./cleaned-trackers.json', JSON.stringify(newFullDb, null, '\t'));

// create one more version of trackers.json with only trackerDomains and categoryId
// so the structure is
// {
//      "timeUpdated": "...",
//      "categories": {
//          "0": "audio_video_player",
//          "1": "comments",
//          ...
//     },
//     "trackerDomains": {
//          "tracker1.com": 0,
//          "tracker2.com": 1,
//          ...
//     }
// }

const trackerDomainsKeys = Object.keys(fullDb.trackerDomains);

const newTrackerDomains = trackerDomainsKeys.reduce((acc, domain) => {
    const trackerId = fullDb.trackerDomains[domain];
    const categoryId = fullDb.trackers[trackerId].categoryId;
    acc[domain] = categoryId;
    return acc;
}, {});

const newFullDb2 = {
    timeUpdated: fullDb.timeUpdated,
    categories: fullDb.categories,
    trackerDomains: newTrackerDomains,
};

fs.writeFileSync('./trackers-min.json', JSON.stringify(newFullDb2));
