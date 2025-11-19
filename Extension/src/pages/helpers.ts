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

import { type FilterMetadata } from '../background/api/filters/main';
import { AntiBannerFiltersId } from '../common/constants';
import { translator } from '../common/translators/translator';

import { FILE_WRONG_EXTENSION_CAUSE } from './common/constants';
import { type NotificationParams, NotificationType } from './common/types';

export const getFilenameExtension = (filename: string): string | undefined => {
    if (!filename) {
        return undefined;
    }
    const parts = filename.split('.');
    if (parts.length < 2) {
        return undefined;
    }
    return parts[parts.length - 1];
};

/**
 * Handles file upload
 *
 * @param file File to upload.
 * @param requiredExtension Required file extension.
 *
 * @returns Promise that resolves with file content as string if file is uploaded successfully,
 * and rejects with error message otherwise.
 */
export const handleFileUpload = (file: File, requiredExtension: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        if (getFilenameExtension(file.name) !== requiredExtension) {
            reject(new Error(
                translator.getMessage(
                    'options_popup_import_settings_wrong_file_ext',
                    { extension: requiredExtension },
                ),
                { cause: FILE_WRONG_EXTENSION_CAUSE },
            ));
        }
        const reader = new FileReader();
        reader.readAsText(file, 'UTF-8');
        reader.onload = (event: Event) => {
            if (event.target) {
                // @ts-ignore
                resolve(event.target.result);
            }
        };
        reader.onerror = () => {
            reject(new Error(translator.getMessage('options_popup_import_error_file_description')));
        };
    });
};

const indexOfIgnoreCase = (str: string, searchString: string): number => {
    return str.toLowerCase().indexOf(searchString.toLowerCase());
};

export const containsIgnoreCase = (str: string | undefined, searchString: string) => {
    return !!(str && searchString && indexOfIgnoreCase(str, searchString) >= 0);
};

export const findChunks = (str: string, searchString: string, chunks: string[] = []) => {
    const ind = indexOfIgnoreCase(str, searchString);
    if (ind > -1) {
        chunks.push(str.slice(0, ind));
        chunks.push(str.slice(ind, ind + searchString.length));
        const restStr = str.slice(ind + searchString.length);
        if (containsIgnoreCase(restStr, searchString)) {
            findChunks(restStr, searchString, chunks);
        } else {
            chunks.push(restStr);
        }
    }
    return chunks.filter((i) => !!i);
};

export const passiveEventSupported = (() => {
    let passiveSupported: boolean | null = null;

    return () => {
        // memoize support to avoid adding multiple test events
        if (typeof passiveSupported === 'boolean') {
            return passiveSupported;
        }

        let supported = false;
        try {
            const options = {
                get passive() {
                    supported = true;
                    return false;
                },
            };

            // @ts-ignore
            window.addEventListener('test', null, options);
            // @ts-ignore
            window.removeEventListener('test', null, options);
        } catch (err) {
            supported = false;
        }
        passiveSupported = supported;
        return passiveSupported;
    };
})();

export const copyToClipboard = (text: string): void => {
    const textarea = document.createElement('textarea');
    textarea.innerText = text;
    // @ts-ignore
    textarea.style = `
        position: absolute;
        display: hidden;
        width: 0;
        height: 0;
    `;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
};

export const measureTextWidth = (text: string) => {
    const el = document.createElement('p');
    el.innerText = text;
    // @ts-ignore
    el.style = `
        position: absolute;
        display: hidden;
        height: 0;
        white-space: nowrap;
        font-family: Roboto, "Open Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Ubuntu, Arial, sans-serif;
        font-size: 14px;
    `;
    document.body.appendChild(el);
    const pxLength = el.clientWidth;
    el.remove();
    return pxLength;
};

/**
 * Calculates the angle of radius vector of the scroll motion
 * and detect whether scroll is vertical
 *
 * @param deltaY Wheel event deltaY value.
 * @param  deltaX Wheel event deltaX value.
 *
 * @returns True if scroll is vertical, false otherwise.
 */
export const isVerticalScroll = (() => {
    const degToRad = (deg: number) => deg * (Math.PI / 180);

    const deg60ToRad = degToRad(60);
    const deg90ToRad = degToRad(90);
    const deg120ToRad = degToRad(120);
    const deg240ToRad = degToRad(240);
    const deg270ToRad = degToRad(270);
    const deg300ToRad = degToRad(300);

    return (deltaY: number, deltaX: number) => {
        if (deltaY === 0) {
            return false;
        }
        let angle = Math.atan(deltaX / deltaY);
        angle = (deltaY > 0) ? angle + deg90ToRad : angle + deg270ToRad;
        return (angle > deg60ToRad && angle < deg120ToRad)
            || (angle > deg240ToRad && angle < deg300ToRad);
    };
})();

/**
 * Checks the length of the array with filters and returns the contents for notification.
 *
 * @param updatedFilters Array with updated filters.
 *
 * @returns Object with title and description describing error if `updatedFilters` is not provided,
 * otherwise description with information about updated filters.
 */
export const updateFilterDescription = (updatedFilters?: FilterMetadata[]): NotificationParams => {
    if (!updatedFilters) {
        return {
            type: NotificationType.Error,
            text: translator.getMessage('options_popup_update_error'),
        };
    }

    const filterNames = updatedFilters.map((filter) => filter.name).join(', ');

    // no updated filters
    let text = `${filterNames} ${translator.getMessage('options_popup_update_not_found')}`;

    if (updatedFilters.length === 1) {
        text = `${filterNames} ${translator.getMessage('options_popup_update_filter')}`;
    } else if (updatedFilters.length > 1) {
        text = `${filterNames} ${translator.getMessage('options_popup_update_filters')}`;
    }

    return {
        type: NotificationType.Success,
        text,
    };
};

/**
 * Returns filter name for filterId.
 *
 * @param filterId Filter id.
 * @param filtersMetadata Filters metadata.
 *
 * @returns Filter name for filterId.
 */
export const getFilterName = (
    filterId: number | undefined,
    filtersMetadata: FilterMetadata[] | null,
): string | null => {
    if (filterId === undefined || !filtersMetadata) {
        return null;
    }

    if (filterId === AntiBannerFiltersId.UserFilterId) {
        return translator.getMessage('options_userfilter');
    }

    if (filterId === AntiBannerFiltersId.AllowlistFilterId) {
        return translator.getMessage('options_allowlist');
    }

    const filterMetadata = filtersMetadata.find((el) => el.filterId === filterId);

    return filterMetadata ? filterMetadata.name : null;
};
