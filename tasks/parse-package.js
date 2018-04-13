import fs from 'fs';

const packageJSON = JSON.parse(fs.readFileSync('package.json'));

export const version = packageJSON.version;
