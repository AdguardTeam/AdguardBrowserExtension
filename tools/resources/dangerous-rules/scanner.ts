/* eslint-disable no-restricted-syntax, no-console */
/**
 * Copyright (c) 2015-2025 Adguard Software Ltd.
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

/**
 * Config for scanner.
 */
const config = {
    searchTerms: [
        /createElement/,
        /setAttribute/,
        /\.src/,
        /eval/,
    ],
    includePatterns: [
        '#%#',
        '#@%#',
    ],
    excludePatterns: [
        '//scriptlet',
        '#%#var AG_abortInlineScript',
    ],
    fileExtension: '.txt',
    excludeFileName: 'optimized',
};

/**
 * Scan's result type.
 * List of potentially dangerous rules that match the criteria and the file they were found in.
 */
type ScanResult = {
    file: string;
    text: string;
};

/**
 * Function to check if a line matches the criteria for a potentially dangerous rule.
 *
 * @param rowLine Line to check.
 *
 * @returns True if the line matches the criteria, false otherwise.
 */
export function isMatchingCriteria(rowLine: string): boolean {
    const line = rowLine.trim();

    // ignore comments
    if (line.startsWith('!')) {
        return false;
    }

    const include = config.includePatterns.some((pattern) => line.includes(pattern));
    if (!include) {
        return false;
    }

    const exclude = config.excludePatterns.some((pattern) => line.includes(pattern));
    if (exclude) {
        return false;
    }

    return config.searchTerms.some((regex) => regex.test(line));
}

/**
 * Searches for potentially dangerous rules in a file and returns an array of matches.
 *
 * @param filePath Path to the file to search in.
 *
 * @returns Promise with an array of matches.
 */
async function searchInFile(filePath: string): Promise<ScanResult[]> {
    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.split(/[\r\n]+/);
    const matches: ScanResult[] = [];

    lines.forEach((line) => {
        if (isMatchingCriteria(line)) {
            matches.push({
                file: filePath,
                text: line.trim(),
            });
        }
    });

    return matches;
}

/**
 * Recursively scans a directory for potentially dangerous rules and returns an array of matches.
 *
 * @param directory Directory to scan.
 *
 * @returns Promise with an array of matches.
 */
async function scanDirectory(directory: string): Promise<ScanResult[]> {
    const files = await fs.readdir(directory);
    let allMatches: ScanResult[] = [];

    for (const file of files) {
        const fullPath = path.join(directory, file);
        const stat = await fs.stat(fullPath);

        if (stat.isDirectory()) {
            const directoryMatches = await scanDirectory(fullPath);
            allMatches = allMatches.concat(directoryMatches);
        } else if (fullPath.endsWith(config.fileExtension) && !fullPath.includes(config.excludeFileName)) {
            const fileMatches = await searchInFile(fullPath);
            allMatches = allMatches.concat(fileMatches);
        }
    }

    return allMatches;
}

/**
 * Recursively scans a directory for potentially dangerous rules and returns an array of matches.
 *
 * @param directoryToScan Directory to scan.
 *
 * @returns Promise with an array of matches.
 */
export async function scanner(directoryToScan: string): Promise<ScanResult[]> {
    let result: ScanResult[] = [];
    try {
        console.log(`Scanning directory: ${directoryToScan}`);
        result = await scanDirectory(directoryToScan);
    } catch (error) {
        console.error('Error scanning directory:', error);
    }
    return result;
}
