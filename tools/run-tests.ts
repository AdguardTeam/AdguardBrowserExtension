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
/* eslint-disable no-console */
import { execa } from 'execa';

const args = process.argv.slice(2);

/**
 * This is a small script that runs tests in both MV2 and MV3.
 * It is useful when you want to run tests for both versions at the same time,
 * e.g.
 * `pnpm run test <file-pattern>`
 * `pnpm run test -- <file-pattern> -t <test-name-pattern>`
 */
async function runTests() {
    let mv2Failed = false;
    let mv3Failed = false;

    try {
        console.log(`Running: pnpm test:mv2 ${args.join(' ')}`);
        await execa('pnpm', ['test:mv2', ...args], { stdio: 'inherit' });
    } catch (error) {
        mv2Failed = true;
    }

    try {
        console.log(`Running: pnpm test:mv3 ${args.join(' ')}`);
        await execa('pnpm', ['test:mv3', ...args], { stdio: 'inherit' });
    } catch (error) {
        mv3Failed = true;
    }

    if (mv2Failed || mv3Failed) {
        if (mv2Failed) {
            console.error('MV2 has failing tests');
        }

        if (mv3Failed) {
            console.error('MV3 has failing tests');
        }

        process.exit(1);
    }
}

runTests();
