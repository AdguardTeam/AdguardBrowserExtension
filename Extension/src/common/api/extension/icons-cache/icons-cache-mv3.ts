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

import { logger } from '@adguard/tsurlfilter';

import { IconsCacheCommon } from './icons-cache-common';

class IconsCache extends IconsCacheCommon {
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
    // eslint-disable-next-line class-methods-use-this
    protected async loadImageData(size: number, url: string): Promise<ImageData> {
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
            logger.error('[ext.IconsCache.loadImageData]: failed to load image:', error);
            throw error;
        }
    }
}

export const iconsCache = new IconsCache();
