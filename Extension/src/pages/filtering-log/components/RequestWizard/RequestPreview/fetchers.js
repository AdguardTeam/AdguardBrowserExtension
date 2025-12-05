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

// async functions invoking by state machine on fetch event.
// https://xstate.js.org/docs/guides/communication.html#invoking-promises

/**
 * Fetches text.
 *
 * @param {object} eventObj Event object.
 * @param {object} eventObj.input Event input property with data object which contains url.
 *
 * @returns {Promise<string>} Text content.
 */
export const fetchText = async ({ input }) => {
    const { data } = input;
    const { url } = data;

    const res = await fetch(url);
    return res.text();
};

/**
 * Fetches image.
 *
 * @param {object} eventObj Event object.
 * @param {object} eventObj.input Event input property with data object which contains url.
 *
 * @returns {Promise<string>} Image data URL.
 */
export const fetchImage = async ({ input }) => {
    const { data } = input;
    const { url } = data;

    const res = await fetch(url);
    const blob = await res.blob();
    const dataUrl = URL.createObjectURL(blob);

    // check image size
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.src = url;

        const loadHandler = (event) => {
            const { width, height } = event.target;

            if (width > 1 && height > 1) {
                resolve(dataUrl);
            } else {
                reject(new Error('Image is too small'));
            }
        };

        image.addEventListener('load', loadHandler);
        image.addEventListener('error', reject);
    });
};
