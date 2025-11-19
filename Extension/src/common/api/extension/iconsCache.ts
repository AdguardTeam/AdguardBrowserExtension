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
import { type Action } from 'webextension-polyfill';

import { logger } from '../../logger';

const cache = new Map<string, ImageData>();

/**
 * Downloads image and converts it to {@link ImageData}.
 * Since it uses new Image() it cannot be used in the mv3 extension.
 * {@link loadImageDataMv3} used in the mv3 extensions
 *
 * @param size Icon size in px.
 * @param url Icon url.
 *
 * @returns Image pixel data.
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
                reject(new Error('Cannot load image data'));
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
 * Downloads image and converts it to {@link ImageData}.
 * This function is used in MV3 with OffscreenCanvas.
 *
 * @param size Icon size in px.
 * @param url Icon url.
 *
 * @returns Image pixel data.
 *
 * @throws Error if image cannot be loaded.
 */
const loadImageDataMv3 = async (size: number, url: string) => {
    try {
        const response = await fetch(url, { mode: 'cors' });
        if (!response.ok) {
            throw new Error(`Network response was not ok for url: ${url}`);
        }
        const blob = await response.blob();
        const bitmap = await createImageBitmap(blob);
        const offscreenCanvas = new OffscreenCanvas(size, size);
        const ctx = offscreenCanvas.getContext('2d');

        if (!ctx) {
            throw new Error('Cannot load image data');
        }

        ctx.drawImage(bitmap, 0, 0, size, size);
        const imageData = ctx.getImageData(0, 0, size, size);
        return imageData;
    } catch (error) {
        logger.error('[ext.iconsCache]: failed to load image:', error);
        throw error;
    }
};

/**
 * Returns ImageData.
 *
 * @param size Icon size in px.
 * @param url Icon url.
 *
 * @returns Entry with image size and {@link ImageData}.
 */
async function getImageData(size: string, url: string) : Promise<[string, ImageData]> {
    // TODO create abstraction for separating modules for loadImageDataMv3 and loadImageData
    const loadImageDataFn = __IS_MV3__ ? loadImageDataMv3 : loadImageData;
    const imageData = cache.get(url);
    if (!imageData) {
        const data = await loadImageDataFn(Number(size), url);
        cache.set(url, data);
        return [size, data];
    }

    return [size, imageData];
}

/**
 * Matches urls from browserAction.setIcon 'path' property with cached ImageData values
 * and returns 'imageData' object for this action.
 *
 * @see https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/browserAction/setIcon
 *
 * @param path Browser.browserAction.setIcon 'path' property.
 *
 * @returns Browser.browserAction.setIcon 'imageData' property.
 */
export async function getIconImageData(path: Record<string, string>): Promise<Record<string, Action.ImageDataType>> {
    const imageDataEntriesPromises = Object.entries(path).map(([size, url]) => getImageData(size, url));

    const imageDataEntries = await Promise.all(imageDataEntriesPromises);

    return Object.fromEntries(imageDataEntries) as Record<string, Action.ImageDataType>;
}
