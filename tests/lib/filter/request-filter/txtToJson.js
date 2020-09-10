/* eslint-disable no-console */
const fs = require('fs');

// this script transforms txt file with rules into js file
// run script with command `node txtToJson.js`
const txtPath = 'test_filter.txt';
const jsPath = 'test_filter.js';

fs.readFile(txtPath, 'utf8', (err, data) => {
    if (err) {
        console.log(err);
    }
    if (data) {
        const rules = data.split('\n');
        const json = JSON.stringify(rules);
        fs.writeFile(jsPath, `export const filtersFromTxt = ${json}`, (err) => {
            if (err) {
                console.log(err);
            }
            console.log(`The file "${txtPath}" has been converted into "${jsPath}"`);
        });
    }
});
