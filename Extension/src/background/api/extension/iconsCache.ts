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
import { Action } from 'webextension-polyfill';

const cache = new Map<string, ImageData>();

/**
 * Download image and convert it to {@link ImageData}
 *
 * @param size - icon size in px
 * @param url - icon url
 * @returns image pixel data
 */
function loadImageData(size: number, url: string): Promise<ImageData> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = url;
        img.onload = (): void => {
            const canvas = document.createElement('canvas');
            document.documentElement.appendChild(canvas);
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                reject(new Error('Can\'t load image data'));
                return;
            }

            ctx.drawImage(img, 0, 0);
            const data = ctx.getImageData(0, 0, size, size);
            canvas.remove();
            resolve(data);
        };
        img.onerror = reject;
    });
}

/**
 * Get ImageData for specific url
 *
 * @param size - icon size in px
 * @param url - icon url
 *
 * @returns entry with image size and {@link ImageData}
 */
async function getImageData(size: string, url: string) : Promise<[string, ImageData]> {
    const imageData = cache.get(url);
    if (!imageData) {
        const data = await loadImageData(Number(size), url);
        cache.set(url, data);
        return [size, data];
    }

    return [size, imageData];
}

/**
 * Match urls from browserAction.setIcon 'path' property with cached ImageData values
 * and return 'imageData' object for this action.
 *
 * @see https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/browserAction/setIcon
 *
 * @param path - browser.browserAction.setIcon 'path' property
 * @returns browser.browserAction.setIcon 'imageData' property
 */
export async function getIconImageData(path: Record<string, string>): Promise<Record<string, Action.ImageDataType>> {
    const imageDataEntriesPromises = Object.entries(path).map(([size, url]) => getImageData(size, url));

    const imageDataEntries = await Promise.all(imageDataEntriesPromises);

    return Object.fromEntries(imageDataEntries) as Record<string, Action.ImageDataType>;
}
