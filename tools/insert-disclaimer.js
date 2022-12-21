/**
 * @file
 * This file is part of AdGuard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * AdGuard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * AdGuard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with AdGuard Browser Extension. If not, see <http://www.gnu.org/licenses/>.
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs');

const disclaimer = `/**
 * @file
 * This file is part of AdGuard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * AdGuard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * AdGuard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with AdGuard Browser Extension. If not, see <http://www.gnu.org/licenses/>.
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
    // eslint-disable-next-line no-console
    console.log('insert disclaimer to: ', path);

    const rows = fs.readFileSync(path).toString().split('\n');

    rows.unshift(...disclaimer.split('\n'));

    fs.writeFileSync(path, rows.join('\n'));
};
