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

import fs from 'node:fs';
import path from 'node:path';

import type { Compiler, RspackPluginInstance } from '@rspack/core';
import archiver from 'archiver';

export interface ZipPluginOptions {
    /**
     * Path relative to the output directory where the zip file should be created.
     */
    outputPath: string;

    /**
     * Name of the zip file (without extension).
     */
    filename: string;
}

/**
 * Custom rspack plugin to create a zip archive of the build output.
 * This replaces the zip-webpack-plugin functionality.
 */
export class ZipPlugin implements RspackPluginInstance {
    /**
     * The plugin options.
     */
    private readonly options: ZipPluginOptions;

    /**
     * Create a new ZipPlugin instance.
     *
     * @param options The plugin options.
     */
    constructor(options: ZipPluginOptions) {
        this.options = options;
    }

    /**
     * Apply the plugin to the compiler.
     *
     * @param compiler The compiler instance.
     */
    apply(compiler: Compiler): void {
        compiler.hooks.afterEmit.tapPromise('ZipPlugin', async (compilation) => {
            const outputPath = compilation.outputOptions.path;
            if (!outputPath) {
                throw new Error('Output path is not defined');
            }

            const zipFilePath = path.resolve(
                outputPath,
                this.options.outputPath,
                `${this.options.filename}.zip`,
            );

            // Ensure the directory exists
            const zipDir = path.dirname(zipFilePath);
            if (!fs.existsSync(zipDir)) {
                fs.mkdirSync(zipDir, { recursive: true });
            }

            await ZipPlugin.createZip(outputPath, zipFilePath);
        });
    }

    /**
     * Create a zip archive of the build output.
     *
     * @param sourceDir The source directory.
     * @param zipFilePath The path to the zip file.
     *
     * @returns A promise that resolves when the zip file is created.
     */
    private static createZip(sourceDir: string, zipFilePath: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const output = fs.createWriteStream(zipFilePath);
            const archive = archiver('zip', {
                zlib: { level: 9 }, // Best compression
            });

            output.on('close', () => {
                // eslint-disable-next-line no-console
                console.log(`Created ${zipFilePath} (${archive.pointer()} bytes)`);
                resolve();
            });

            archive.on('error', (err) => {
                reject(err);
            });

            archive.pipe(output);

            // Add all files from the source directory
            archive.directory(sourceDir, false);

            archive.finalize();
        });
    }
}
