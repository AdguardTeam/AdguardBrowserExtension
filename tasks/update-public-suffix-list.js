import gulp from 'gulp';
import request from 'request';
import fs from 'fs';
import path from 'path';
import {
    PUBLIC_SUFFIXES_URL,
    PUBLIC_SUFFIXES_FILE
} from './consts';

const startDownload = async (done) => {
    await updateSuffixes();
    return done();
}

const updateSuffixes = () => {
    return new Promise((resolve, reject) => {
        request(PUBLIC_SUFFIXES_URL, (error, response, body) => {
            if(error) {
                reject(error);
            }
            resolve();
        })
        .pipe(fs.createWriteStream(path.join(__dirname, PUBLIC_SUFFIXES_FILE)));
    });
};

export default gulp.series((done) => startDownload(done));
