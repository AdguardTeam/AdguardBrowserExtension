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

import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

import { toasts } from '../../../../../Extension/src/background/api/ui/toasts';
import { TabsApi } from '../../../../../Extension/src/common/api/extension';
import { sendTabMessage, MessageType } from '../../../../../Extension/src/common/messages';
import { translator } from '../../../../../Extension/src/common/translators/translator';
import { promoNotificationApi } from '../../../../../Extension/src/background/api/ui/promo-notification';

vi.mock('../../../../../Extension/src/common/api/extension');
vi.mock('../../../../../Extension/src/common/messages');
vi.mock('../../../../../Extension/src/common/translators/translator');
vi.mock('../../../../../Extension/src/background/api/ui/promo-notification');

describe('Toasts', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Mock fetch for CSS loading
        global.fetch = vi.fn().mockResolvedValue({
            text: vi.fn().mockResolvedValue('mock-css-content'),
        });
    });

    describe('showApplicationUpdatedPopup', () => {
        beforeEach(async () => {
            await toasts.init();
            vi.mocked(TabsApi.getActive).mockResolvedValue({ id: 1, url: 'https://example.com' } as any);
            vi.mocked(TabsApi.isAdguardExtensionTab).mockReturnValue(false);
            vi.mocked(promoNotificationApi.getCurrentNotification).mockResolvedValue(null);
            vi.mocked(translator.getMessage).mockReturnValue('mock-message');
        });

        it('should not show popup for auto-build updates (only build number changed)', async () => {
            await toasts.showApplicationUpdatedPopup('5.2.3.100', '5.2.3.99');

            expect(sendTabMessage).not.toHaveBeenCalled();
        });

        it('should not show popup for patch version updates without promo', async () => {
            await toasts.showApplicationUpdatedPopup('5.2.4.0', '5.2.3.100');

            expect(sendTabMessage).not.toHaveBeenCalled();
        });

        it('should show popup for minor version updates', async () => {
            await toasts.showApplicationUpdatedPopup('5.3.0.0', '5.2.3.100');

            expect(sendTabMessage).toHaveBeenCalledWith(
                1,
                expect.objectContaining({
                    type: MessageType.ShowVersionUpdatedPopup,
                }),
            );
        });

        it('should show popup for major version updates', async () => {
            await toasts.showApplicationUpdatedPopup('6.0.0.0', '5.2.3.100');

            expect(sendTabMessage).toHaveBeenCalledWith(
                1,
                expect.objectContaining({
                    type: MessageType.ShowVersionUpdatedPopup,
                }),
            );
        });

        it('should not show popup when build number decreased (downgrade)', async () => {
            await toasts.showApplicationUpdatedPopup('5.2.3.50', '5.2.3.100');

            expect(sendTabMessage).not.toHaveBeenCalled();
        });

        it('should not show popup for equal versions', async () => {
            await toasts.showApplicationUpdatedPopup('5.2.3.100', '5.2.3.100');

            expect(sendTabMessage).not.toHaveBeenCalled();
        });

        it('should not show popup when major and minor are same with no promo', async () => {
            await toasts.showApplicationUpdatedPopup('5.2.4.0', '5.2.3.0');

            expect(sendTabMessage).not.toHaveBeenCalled();
        });

        it('should show popup for patch version updates when promo is available', async () => {
            const mockPromo = {
                id: '1',
                url: 'https://example.com',
                text: {
                    en: {
                        title: 'Promo Title',
                        btn: 'Click Me',
                    },
                },
            };
            vi.mocked(promoNotificationApi.getCurrentNotification).mockResolvedValue(mockPromo as any);

            await toasts.showApplicationUpdatedPopup('5.2.4.0', '5.2.3.0');

            expect(sendTabMessage).toHaveBeenCalledWith(
                1,
                expect.objectContaining({
                    type: MessageType.ShowVersionUpdatedPopup,
                }),
            );
        });

        it('should return early for invalid current version', async () => {
            await toasts.showApplicationUpdatedPopup('invalid.version', '5.2.3.100');

            expect(sendTabMessage).not.toHaveBeenCalled();
        });

        it('should return early for invalid previous version', async () => {
            await toasts.showApplicationUpdatedPopup('5.2.3.100', 'invalid.version');

            expect(sendTabMessage).not.toHaveBeenCalled();
        });

        it('should handle auto-build updates correctly (edge case: build 999 to 1000)', async () => {
            await toasts.showApplicationUpdatedPopup('5.2.3.1000', '5.2.3.999');

            expect(sendTabMessage).not.toHaveBeenCalled();
        });

        it('should not show popup when patch increases with build increase without promo', async () => {
            await toasts.showApplicationUpdatedPopup('5.2.4.100', '5.2.3.99');

            expect(sendTabMessage).not.toHaveBeenCalled();
        });

        it('should show popup when minor increases with build decrease', async () => {
            await toasts.showApplicationUpdatedPopup('5.3.0.1', '5.2.5.999');

            expect(sendTabMessage).toHaveBeenCalledWith(
                1,
                expect.objectContaining({
                    type: MessageType.ShowVersionUpdatedPopup,
                }),
            );
        });
    });
});
