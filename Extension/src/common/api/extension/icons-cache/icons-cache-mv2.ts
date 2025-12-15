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

import { IconsCacheCommon } from './icons-cache-common';

class IconsCache extends IconsCacheCommon {
    /**
     * Loads an image and converts it to {@link ImageData} using HTMLImageElement.
     * This implementation is specific to Manifest V2 as it uses the DOM API.
     *
     * @param size - The width and height of the icon in pixels.
     * @param url - The URL of the icon image to load.
     *
     * @returns A Promise that resolves with the ImageData of the loaded icon.
     *
     * @throws {Error} If the image cannot be loaded or canvas context is not available.
     */
    // eslint-disable-next-line class-methods-use-this
    protected loadImageData(size: number, url: string): Promise<ImageData> {
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
}

export const iconsCache = new IconsCache();
