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

import { promises as fs } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

export const validateSyntax = (code: string, desc: string): void => {
    try {
        // eslint-disable-next-line no-new
        new vm.Script(code);
    } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        throw new Error(`Syntax error in ${desc}: ${msg}`);
    }
};

export const writeBundle = async (content: string, filePath: string): Promise<void> => {
    validateSyntax(content, path.basename(filePath));
    await fs.writeFile(filePath, content, 'utf-8');
};
