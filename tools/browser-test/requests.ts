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

import axios from 'axios';

import { TESTCASES_BASE_URL, TESTCASES_DATA_PATH } from './test-constants';
import { type Testcase } from './testcase';

axios.defaults.baseURL = TESTCASES_BASE_URL;

/**
 * Helper function to make a GET request.
 *
 * @param url URL to make a GET request to.
 *
 * @returns Promise with the response data.
 */
export const get = async <ResponseData>(url: string): Promise<ResponseData> => {
    const res = await axios.get<ResponseData>(url, {
        /**
         * Validate the status code of the response.
         *
         * @param status Status code of the response.
         *
         * @returns True if the status code is 200, false otherwise.
         */
        validateStatus: (status): boolean => {
            return status === 200; // Resolve only if the status code is 200
        },
    });

    return res.data;
};

/**
 * Get the rule text from the specified path.
 *
 * @param path Path to the rule text.
 *
 * @returns Promise with the rule text.
 */
export const getRuleText = (path: string): Promise<string> => get<string>(path);

/**
 * Get the testcases from the specified path.
 *
 * @returns Promise with the testcases.
 */
export const getTestcases = (): Promise<Testcase[]> => get<Testcase[]>(TESTCASES_DATA_PATH);
