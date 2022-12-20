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
import webpack from 'webpack';

export const bundleRunner = (webpackConfig, watch = false) => {
    const compiler = webpack(webpackConfig);

    const run = watch
        ? (cb) => compiler.watch({}, cb)
        : (cb) => compiler.run(cb);

    return new Promise((resolve, reject) => {
        run((err, stats) => {
            if (err) {
                console.error(err.stack || err);
                if (err.details) {
                    console.error(err.details);
                }
                reject();
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
                reject();
                return;
            }

            console.log(stats.toString({
                chunks: false,  // Makes the build much quieter
                colors: true,    // Shows colors in the console
            }));
            resolve();
        });
    });
};
