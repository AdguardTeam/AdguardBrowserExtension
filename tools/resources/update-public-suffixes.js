import axios from 'axios';
import { promises as fs } from 'fs';
import path from 'path';
import punycode from 'punycode';
import {
    PUBLIC_SUFFIXES_URL,
    PUBLIC_SUFFIXES_FILE,
} from '../constants';

const convertListToObject = (list) => {
    const rows = list.split('\n');
    const suffixesWithoutCommentsAndSpaces = rows.filter((row) => {
        return !(row.length === 0 || row.indexOf('//') !== -1);
    });
    const suffixesWithoutSpecialRules = suffixesWithoutCommentsAndSpaces.filter((suffix) => {
        return !(suffix.indexOf('*') !== -1 || suffix.indexOf('!') !== -1);
    });
    const suffixesInPunycode = suffixesWithoutSpecialRules.map((suffix) => {
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
        .forEach((suffix) => {
            suffixesObject[suffix] = 1;
        });
    return suffixesObject;
};

const updateSuffixes = async () => {
    const response = await axios.get(PUBLIC_SUFFIXES_URL);
    const jsonString = JSON.stringify(convertListToObject(response.data), null, 2);
    const data = await fs.readFile(path.join(__dirname, PUBLIC_SUFFIXES_FILE), 'utf-8');
    const updatedData = data.replace(
        /(\/\/\%START_RESERVED_DOMAINS\%)[\s\S]*?(\/\/\%END_RESERVED_DOMAINS\%)/g,
        `$1\n${jsonString}\n  $2`
    );
    await fs.writeFile(path.join(__dirname, PUBLIC_SUFFIXES_FILE), updatedData);
};

export const updatePublicSuffixes = async () => {
    await updateSuffixes();
};
