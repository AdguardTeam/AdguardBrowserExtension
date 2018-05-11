import gulp from 'gulp';
import request from 'request';
import fs from 'fs';
import path from 'path';
import punycode from 'punycode';
import {
    PUBLIC_SUFFIXES_URL,
    PUBLIC_SUFFIXES_FILE
} from './consts';

const convertListToObject = (list) => {
    const rows = list.split('\n');
    const suffixesWithoutCommentsAndSpaces = rows.filter((row) => {
        return !(row.length === 0 || row.indexOf('//') !== -1);
    });
    const suffixesBiggerThenFirstLevel = suffixesWithoutCommentsAndSpaces.filter(suffix => {
        return suffix.split('.').length > 1;
    });
    const suffixesWithoutSpecialRules = suffixesBiggerThenFirstLevel.filter(suffix => {
        return !(suffix.indexOf('*') !== -1 || suffix.indexOf('!') !== -1);
    });
    const suffixesInPunycode = suffixesWithoutSpecialRules.map(suffix => {
        return punycode.toASCII(suffix);
    });
    const suffixesObject = {};
    suffixesInPunycode
        .sort((a, b) => {
            if (a === b) {
                return 0;
            }
            return a > b ? 1 : -1;
        })
        .forEach(suffix => {
            suffixesObject[suffix] = 1;
        });
    return suffixesObject;
};

const writeFileSync = (data, path) => {
    return new Promise((resolve, reject) => {
        fs.writeFile(path, data, (err) => {
            if (err) {
                reject(err);
            }
            resolve();
        });
    });
};

const updateSuffixes = () => {
    return request(PUBLIC_SUFFIXES_URL, (error, response, body) => {
        const jsonString = JSON.stringify(convertListToObject(body), null, 2);
        writeFileSync(jsonString, path.join(__dirname, PUBLIC_SUFFIXES_FILE));
    });
};

const startDownload = async (done) => {
    await updateSuffixes();
    return done();
}

const updatePublicSuffixes = (done) => startDownload(done);

export default gulp.series(updatePublicSuffixes);
