/**
 * Copyright (c) 2015-2026 Adguard Software Ltd.
 *
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

import { exec as execCallback } from 'node:child_process';
import { promisify } from 'node:util';
import assert from 'node:assert';

import { Argument, program } from 'commander';

import {
    AssetsFiltersBrowser,
    MV3_ASSETS_FILTERS_BROWSERS,
    type Mv3AssetsFiltersBrowser,
} from './constants';

const exec = promisify(execCallback);

program
    .description('Extract unsafe rules from browser filters')
    .addArgument(
        new Argument('<browser>', 'Browser name to extract unsafe rules for')
            .choices(MV3_ASSETS_FILTERS_BROWSERS)
            .default(AssetsFiltersBrowser.ChromiumMv3),
    )
    .action(async (browser: Mv3AssetsFiltersBrowser) => {
        const command = `pnpm exec dnr-rulesets exclude-unsafe-rules ./Extension/filters/${browser}/declarative`;
        const result = await exec(command);
        assert.ok(result.stderr === '', 'No errors during execution');
    });

program.parse(process.argv);
