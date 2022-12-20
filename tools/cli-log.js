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
import chalk from 'chalk';

const info = (text) => {
    if (text) {
        console.log(text);
    } else {
        console.log('Unknown info');
    }
};

const success = (text) => {
    if (text) {
        console.log(chalk.green.bgBlack(text));
    } else {
        info();
    }
};

const warning = (text) => {
    if (text) {
        console.log(chalk.black.bgYellowBright(text));
    } else {
        info();
    }
};

const warningRed = (text) => {
    if (text) {
        console.log(chalk.bold.yellow.bgRed(text));
    } else {
        info();
    }
};

const error = (text) => {
    if (text) {
        console.log(chalk.bold.yellow.bgRed(text));
        throw new Error(text);
    } else {
        throw new Error('Unknown error');
    }
};

export const cliLog = {
    info,
    success,
    warning,
    warningRed,
    error,
};
