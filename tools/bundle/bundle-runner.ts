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
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
    rspack,
    type Configuration,
    type Stats,
} from '@rspack/core';
import { merge } from 'webpack-merge';

/* eslint-disable @typescript-eslint/naming-convention */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
/* eslint-enable @typescript-eslint/naming-convention */

/**
 * Options for the bundle runner.
 */
export interface BundleRunnerOptions {
    /**
     * Whether to run in watch mode.
     */
    watch?: boolean;

    /**
     * Whether to enable caching.
     */
    cache?: boolean;
}

/**
 * Callback type for rspack compiler.
 */
type CompilerCallback = (err: Error | null, stats?: Stats) => void;

/**
 * Runs the rspack bundler with the given configuration.
 *
 * @param rspackConfig The rspack configuration.
 * @param options The bundle runner options.
 *
 * @returns A promise that resolves when the build is complete.
 */
export const bundleRunner = (
    rspackConfig: Configuration,
    options: BundleRunnerOptions,
): Promise<void> => {
    const { watch, cache } = options;

    let config = rspackConfig;

    // Without cache, building watches linked dependencies, but building takes longer.
    // With cache, building happens almost instantly, but changes from linked dependencies are not applied.
    if (watch) {
        // Disabling cache is crucial in watch mode as it allows tracking
        // changes in the @adguard dependencies and rebuilding vendors correctly.
        config = merge(config, { cache });
    }

    const compiler = rspack(config);

    const run = watch
        ? (cb: CompilerCallback) => compiler.watch({
            // We may be using symlinked dependencies (tsurlfilter, etc) so it's
            // important that watch should follow symlinks.
            followSymlinks: true,
            aggregateTimeout: 300,
            // This will exclude everything in node_modules except for @adguard, build,
            // and _locales (the latter unexpectedly triggers even though it is not changing,
            // which could be a bug in rspack).
            ignored: [
                '/node_modules(?!/@adguard)/',
                'build',
                path.resolve(__dirname, 'Extension/_locales'),
            ],
        }, cb)
        : (cb: CompilerCallback) => compiler.run(cb);

    return new Promise((resolve, reject) => {
        run((err, stats) => {
            if (err) {
                console.error(err.stack || err);
                if ((err as NodeJS.ErrnoException).message) {
                    console.error((err as NodeJS.ErrnoException).message);
                }
                reject(new Error('Build failed'));
                return;
            }

            if (!stats) {
                reject(new Error('No stats returned from rspack'));
                return;
            }

            if (stats.hasErrors()) {
                console.log(stats.toString({
                    colors: true,
                    all: false,
                    errors: true,
                    moduleTrace: true,
                    logging: 'error',
                }));
                reject(new Error('Build has errors'));
                return;
            }

            console.log(stats.toString({
                chunks: false,  // Makes the build much quieter
                colors: true,   // Shows colors in the console
            }));
            resolve();
        });
    });
};
