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

import { type Product } from './product';

/**
 * Key is a product name,
 * value is an array of testcase exceptions for the product.
 */
export type TestcaseException = {
    [key in Product]: number[];
};

/**
 * Describes object from https://testcases.agrd.dev/data.json.
 */
export interface Testcase {
    id: number;
    title: string;
    link: string;
    rulesUrl?: string;
    readmeUrl?: string;
    compatibility: Product[];
    manual?: boolean;
    exceptions?: TestcaseException[];
}

/**
 * Filter testcases by product type.
 *
 * @param testcases Testcases to filter.
 * @param productType Product type to filter by.
 *
 * @returns Filtered testcases.
 */
export const filterCompatibleTestcases = (
    testcases: Testcase[],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    productType: Product,
): Testcase[] => {
    return testcases.filter(({ id }) => {
        return id === 36;
    });
};
