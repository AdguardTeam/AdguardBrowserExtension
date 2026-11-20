/**
 * Copyright (c) 2015-2026 Adguard Software Ltd.
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

import {
    describe,
    expect,
    it,
} from 'vitest';

import { BuildTargetEnv } from '../../../constants';
import { Browser } from '../../../tools/constants';
import { updateLocaleMessages } from '../../../tools/helpers';

const CWS_DESCRIPTION_MAX_LENGTH = 132;

const LOCALE_DESCRIPTION = 'Description from the locale file';

/**
 * Builds the description of the given locale for the given build target.
 *
 * @param locale Locale of the messages.
 * @param env Build environment.
 * @param browser Target browser.
 *
 * @returns Description after the build transform.
 */
const buildDescription = (locale: string, env: BuildTargetEnv, browser: Browser): string => {
    const messages = Buffer.from(JSON.stringify({
        name: { message: 'AdGuard' },
        description: { message: LOCALE_DESCRIPTION },
    }));

    return JSON.parse(updateLocaleMessages(messages, locale, env, browser)).description.message;
};

describe('Chrome Web Store description', () => {
    it.each([
        BuildTargetEnv.Dev,
        BuildTargetEnv.Beta,
        BuildTargetEnv.Release,
    ])('replaces the English description of chrome-mv3 in %s', (env) => {
        const description = buildDescription('en', env, Browser.ChromeMv3);

        expect(description).not.toBe(LOCALE_DESCRIPTION);
        expect(description.length).toBeLessThanOrEqual(CWS_DESCRIPTION_MAX_LENGTH);
    });

    it.each(['ru', 'de', 'zh_CN'])('keeps the %s description of chrome-mv3', (locale) => {
        expect(buildDescription(locale, BuildTargetEnv.Release, Browser.ChromeMv3)).toBe(LOCALE_DESCRIPTION);
    });

    it.each(
        Object.values(Browser).filter((browser) => browser !== Browser.ChromeMv3),
    )('keeps the English description of %s', (browser) => {
        expect(buildDescription('en', BuildTargetEnv.Release, browser)).toBe(LOCALE_DESCRIPTION);
    });
});
