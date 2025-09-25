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

import { type Action } from 'webextension-polyfill';

/**
 * Abstract base class for caching browser extension icons.
 *
 * Provides caching functionality for icon ImageData objects to avoid redundant loading.
 * Concrete implementations handle manifest-specific loading strategies (MV2/MV3).
 */
export abstract class IconsCacheCommon {
    /**
     * Internal cache storage mapping icon URLs to ImageData objects.
     */
    protected cache = new Map<string, ImageData>();

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
    public async getIconImageData(path: Record<string, string>): Promise<Record<string, Action.ImageDataType>> {
        const imageDataEntriesPromises = Object.entries(path).map(([size, url]) => this.getImageData(size, url));

        const imageDataEntries = await Promise.all(imageDataEntriesPromises);

        return Object.fromEntries(imageDataEntries) as Record<string, Action.ImageDataType>;
    }

    /**
     * Abstract method to be implemented by child classes to load image data.
     *
     * @param size Icon size in px.
     * @param url Icon url.
     *
     * @returns Promise that resolves with ImageData of the loaded icon.
     */
    protected abstract loadImageData(size: number, url: string): Promise<ImageData>;

    /**
     * Returns ImageData.
     *
     * @param size Icon size in px.
     * @param url Icon url.
     *
     * @returns Entry with image size and {@link ImageData}.
     */
    private async getImageData(size: string, url: string): Promise<[string, ImageData]> {
        const imageData = this.cache.get(url);
        if (!imageData) {
            const data = await this.loadImageData(Number(size), url);
            this.cache.set(url, data);
            return [size, data];
        }

        return [size, imageData];
    }
}
