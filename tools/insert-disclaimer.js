/**
 * @file
 * This file is part of Adguard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * Adguard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Adguard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Adguard Browser Extension. If not, see <http://www.gnu.org/licenses/>.
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs');

const disclaimer = `/**
 * @file
 * This file is part of Adguard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * Adguard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Adguard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Adguard Browser Extension. If not, see <http://www.gnu.org/licenses/>.
 */
`;

const stdin = process.openStdin();

let data = '';

// Wait for ESLint check output from pipe with string like:
//
// /browser-extension/Extension/src/common/messages/index.ts
//  1:2  error  Missing @file  jsdoc/require-file-overview
// browser-extension/Extension/src/common/messages/sendMessage.ts
//  1:2  error  Missing @file  jsdoc/require-file-overview
//
stdin.on('data', (chunk) => {
    data += chunk;
});

stdin.on('end', async () => {
    await insertDisclaimer(data);
});

const insertDisclaimer = async (data) => {
    const lines = data.split('\n');

    for (let i = 0; i < data.length; i += 1) {
        const s = lines[i];

        if (s?.includes('Missing @file')) {
            const path = lines[i - 1];

            insertAndSave(path);
        }
    }
};

const insertAndSave = (path) => {
    console.log('insert disclaimer to: ', path);

    const rows = fs.readFileSync(path).toString().split('\n');

    rows.unshift(...disclaimer.split('\n'));

    fs.writeFileSync(path, rows.join('\n'));
};
