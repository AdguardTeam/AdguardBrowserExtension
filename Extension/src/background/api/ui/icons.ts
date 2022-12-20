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
import browser from 'webextension-polyfill';

import { SettingOption } from '../../schema';
import { settingsStorage } from '../../storages';
import { getIconImageData } from '../extension';
import { FrameData } from './frames';
import { notificationApi } from './notification';

export class IconsApi {
    static async updateTabIcon(
        tabId: number,
        {
            documentAllowlisted,
            applicationFilteringDisabled,
            totalBlockedTab,
        }: FrameData,
    ): Promise<void> {
        let icon: Record<string, string>;
        let badge: string;
        let badgeColor = '#555';

        // Icon is gray only if application is disabled or site is in exception
        const disabled = documentAllowlisted || applicationFilteringDisabled;

        let blocked: number;

        if (!disabled && !settingsStorage.get(SettingOption.DisableShowPageStats)) {
            blocked = totalBlockedTab;
        } else {
            blocked = 0;
        }

        try {
            if (disabled) {
                icon = {
                    '19': browser.runtime.getURL('assets/icons/gray-19.png'),
                    '38': browser.runtime.getURL('assets/icons/gray-38.png'),
                };
            } else {
                icon = {
                    '19': browser.runtime.getURL('assets/icons/green-19.png'),
                    '38': browser.runtime.getURL('assets/icons/green-38.png'),
                };
            }

            if (blocked === 0) {
                badge = '';
            } else if (blocked > 99) {
                badge = '\u221E';
            } else {
                badge = String(blocked);
            }

            // If there's an active notification, indicate it on the badge
            const notification = await notificationApi.getCurrentNotification();
            if (notification) {
                badge = notification.badgeText || badge;
                badgeColor = notification.badgeBgColor || badgeColor;

                if (disabled) {
                    if (notification?.icons?.ICON_GRAY) {
                        icon = notification.icons.ICON_GRAY;
                    }
                } else if (notification?.icons?.ICON_GREEN) {
                    icon = notification.icons.ICON_GREEN;
                }
            }

            await browser.browserAction.setIcon({ tabId, imageData: await getIconImageData(icon) });

            if (badge) {
                await browser.browserAction.setBadgeText({ tabId, text: badge });
                await browser.browserAction.setBadgeBackgroundColor({ tabId, color: badgeColor });
            }
        } catch (e) {
            // do nothing
        }
    }
}
