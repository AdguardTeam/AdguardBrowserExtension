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

import path from 'path';

import { filesize } from 'filesize';

export const NO_SIZE_LIMIT = 0;

/**
 * Convert megabytes to bytes.
 *
 * @param {number} mb The size in megabytes.
 * @returns {number} The size in bytes.
 */
export const megabytesToBytes = (mb) => mb * 1024 * 1024;

/**
 * Webpack plugin to limit the size of the output files.
 */
export class SizeLimitPlugin {
    /**
     * @typedef {{ [key: string]: number }} SizeLimits
     */

    /**
     * Size limits for the different file extensions.
     *
     * @type {SizeLimits}
     * @private
     */
    limits;

    /**
     * Creates an instance of SizeLimitPlugin.
     *
     * @param {SizeLimits} limits The size limits for the different file extensions. Limits are in bytes.
     */
    constructor(limits) {
        this.limits = limits;
    }

    /**
     * Get the size limit for a file.
     *
     * @param {string} filename The name of the file.
     * @returns {number} The size limit in MB or 0 if no limit is set.
     * @private
     */
    getLimitForFile(filename) {
        const ext = path.parse(filename).ext;
        return this.limits[ext] ?? NO_SIZE_LIMIT;
    }

    /**
     * Apply the plugin to the compiler.
     *
     * @param {import('webpack').Compiler} compiler The webpack compiler.
     */
    apply(compiler) {
        compiler.hooks.emit.tapAsync('SizeLimitPlugin', (compilation, callback) => {
            const problematicFiles = [];

            // eslint-disable-next-line no-restricted-syntax
            for (const [filename, data] of Object.entries(compilation.assets)) {
                const limitInBytes = this.getLimitForFile(filename);
                if (limitInBytes !== NO_SIZE_LIMIT) {
                    const sizeInBytes = data.size();

                    if (sizeInBytes > limitInBytes) {
                        compilation.errors.push(
                            new Error(
                                // eslint-disable-next-line max-len
                                `${filename}'s actual size (${filesize(sizeInBytes)}) exceeds the maximum size limit (${filesize(limitInBytes)})`,
                            ),
                        );
                        problematicFiles.push({ filename, sizeInBytes });
                    }
                }
            }

            if (problematicFiles.length) {
                callback(
                    new Error(
                        // eslint-disable-next-line max-len
                        `Size limit exceeded for the following files: ${problematicFiles.map(({ filename, sizeInBytes }) => `${filename} (${filesize(sizeInBytes)})`).join(', ')}`,
                    ),
                );
            } else {
                callback();
            }
        });
    }
}
